// Home Center integration — pulls weekly goals from the Home Center dashboard
// (https://jthcreative.github.io/home-center/#/dashboard).
//
// Home Center keeps its data in a Firestore project, one document per state
// key in the `appState` collection, each holding the value as a JSON string in
// a `json` field. We read the two goal documents over Firestore's public REST
// API (no Firebase SDK needed):
//   - goals-sections: [{ id, title, color, items: [goal] }]
//   - goals-progress: { [weekKey]: { items: { [goalId]: { done | checks } }, children: { [subId]: bool } } }
//
// The API key below is Home Center's public web config key (it ships in that
// site's client bundle; access is governed by Firestore security rules).

const PROJECT_ID = 'home-center-fb216';
const API_KEY = 'AIzaSyCLjLpVj5XZ8mWZOj1dP59pJ1M8mYPiQ10';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/appState`;

export const HOME_CENTER_URL = 'https://jthcreative.github.io/home-center/#/dashboard';

// Read a state document: its value plus Firestore's updateTime (a version
// stamp used to make writes safe against concurrent edits).
async function readDocVersioned(key) {
  const res = await fetch(`${BASE}/${encodeURIComponent(key)}?key=${API_KEY}`);
  if (res.status === 404) return { value: null, updateTime: null };
  if (!res.ok) throw new Error(`Home Center returned ${res.status} for ${key}`);
  const body = await res.json();
  const raw = body?.fields?.json?.stringValue;
  return { value: raw == null ? null : JSON.parse(raw), updateTime: body.updateTime || null };
}

async function readDoc(key) {
  return (await readDocVersioned(key)).value;
}

class StaleWriteError extends Error {}

// Write a state document only if nobody changed it since `updateTime` (or, when
// null, only if it doesn't exist yet). Same storage format Home Center uses.
async function writeDoc(key, value, updateTime) {
  const precondition = updateTime
    ? `currentDocument.updateTime=${encodeURIComponent(updateTime)}`
    : 'currentDocument.exists=false';
  const res = await fetch(
    `${BASE}/${encodeURIComponent(key)}?key=${API_KEY}&updateMask.fieldPaths=json&${precondition}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(value) } } }),
    }
  );
  if (res.status === 400 || res.status === 409 || res.status === 412) {
    const body = await res.json().catch(() => ({}));
    const status = body?.error?.status;
    if (status === 'FAILED_PRECONDITION' || status === 'ALREADY_EXISTS' || status === 'ABORTED') {
      throw new StaleWriteError(status);
    }
    throw new Error(body?.error?.message || `Home Center rejected the update (${res.status})`);
  }
  if (!res.ok) throw new Error(`Home Center rejected the update (${res.status})`);
}

// Read-modify-write a document. If someone else saved it in between (e.g. the
// Home Center screen), re-read and re-apply instead of overwriting their edit.
async function updateDoc(key, fn, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    const { value, updateTime } = await readDocVersioned(key);
    try {
      await writeDoc(key, fn(value), updateTime);
      return;
    } catch (e) {
      if (!(e instanceof StaleWriteError) || i === attempts - 1) throw e;
    }
  }
}

// Home Center weeks start Sunday and are keyed by that Sunday's local date.
function localSundayKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Same rule Home Center uses: habits and repeating goals show every week;
// one-off goals only in the week they belong to.
const inWeek = (item, weekKey) => item.habit || item.repeats !== false || item.week === weekKey;

const kids = (x) => x.children || [];

/** Fetch the list of goal sections ({ id, title }) for the settings picker. */
export async function fetchHomeCenterSections() {
  const sections = (await readDoc('goals-sections')) || [];
  return sections.map((s) => ({ id: s.id, title: s.title || 'Untitled' }));
}

/**
 * Fetch the goals for the week containing `date`, mapped to the planner's
 * weekly-goal shape:
 *   Home Center goal       -> planner goal
 *   goal's sub-item        -> goal task
 *   sub-item's sub-item    -> task subtask
 * Tally goals ("Read Bible 3/7") carry their count in `tally`.
 *
 * `sectionIds` limits which Home Center sections are pulled (null = all).
 */
export async function fetchHomeCenterWeek(date, sectionIds) {
  const [sections, progress] = await Promise.all([
    readDoc('goals-sections'),
    readDoc('goals-progress'),
  ]);
  const weekKey = localSundayKey(date);
  const wp = (progress || {})[weekKey] || {};
  const itemProgress = wp.items || {};
  const childChecks = wp.children || {};

  const goals = [];
  for (const section of sections || []) {
    if (sectionIds && !sectionIds.includes(section.id)) continue;
    for (const item of section.items || []) {
      if (!item.title?.trim() || !inWeek(item, weekKey)) continue;

      const tasks = kids(item).map((c) => {
        const subtasks = kids(c).map((g) => ({
          remoteId: g.id,
          name: g.title,
          completed: !!childChecks[g.id],
        }));
        return {
          remoteId: c.id,
          name: c.title,
          subtasks,
          completed:
            subtasks.length > 0 ? subtasks.every((st) => st.completed) : !!childChecks[c.id],
        };
      });

      let tally = null;
      let completed;
      if (tasks.length > 0) {
        completed = tasks.every((t) => t.completed);
      } else if (item.type === 'tally') {
        const target = item.target || 0;
        const done = (itemProgress[item.id]?.checks || []).slice(0, target).filter(Boolean).length;
        tally = { done, target };
        completed = target > 0 && done >= target;
      } else {
        completed = !!itemProgress[item.id]?.done;
      }

      goals.push({
        remoteId: item.id,
        remoteWeek: weekKey,
        habit: !!item.habit,
        habitMembers: item.habitMembers || [],
        sectionId: section.id,
        sectionTitle: section.title || '',
        text: item.title.trim(),
        icon: item.type === 'tally' ? '🔁' : '🎯',
        tally,
        completed,
        tasks,
      });
    }
  }
  return goals;
}

/**
 * Push check-offs made in the planner back to Home Center.
 *
 * changes: [
 *   { kind: 'child', week, ids: [subItemId...], done }   // sub-items / nested sub-items
 *   { kind: 'item', week, itemId, done, habit, habitMembers } // a plain checkbox goal
 * ]
 *
 * Writes exactly what Home Center's own Goals page writes for the same tap,
 * including mirroring habit goals onto its Habits board.
 */
export async function pushHomeCenterChanges(changes) {
  if (!changes.length) return;
  const now = Date.now();

  await updateDoc('goals-progress', (progress) => {
    const next = { ...(progress || {}) };
    for (const c of changes) {
      const wk = next[c.week] || { items: {}, children: {} };
      if (c.kind === 'child') {
        const children = { ...(wk.children || {}) };
        const childrenAt = { ...(wk.childrenAt || {}) };
        for (const id of c.ids) {
          children[id] = c.done;
          if (c.done) childrenAt[id] = now;
          else delete childrenAt[id];
        }
        next[c.week] = { ...wk, children, childrenAt };
      } else {
        const entry = { ...((wk.items || {})[c.itemId] || {}), done: c.done };
        if (c.done) entry.doneAt = now;
        else delete entry.doneAt;
        next[c.week] = { ...wk, items: { ...(wk.items || {}), [c.itemId]: entry } };
      }
    }
    return next;
  });

  // Habit-flagged checkbox goals also show on Home Center's Habits board.
  const habitChanges = changes.filter((c) => c.kind === 'item' && c.habit);
  if (habitChanges.length) {
    const roster = (await readDoc('habits-roster')) || [];
    await updateDoc('habits-progress', (progress) => {
      const next = { ...(progress || {}) };
      for (const c of habitChanges) {
        const sharers = c.habitMembers.length > 0 ? c.habitMembers : roster;
        // Point goes to the only member if unambiguous; otherwise to no one
        // (Home Center would ask "Who did it?", which we can't do here).
        const credit = sharers.length === 1 ? sharers[0] : null;
        const week = { ...(next[c.week] || {}) };
        for (const mid of sharers) {
          const e = week[mid]?.[c.itemId] || {};
          week[mid] = {
            ...(week[mid] || {}),
            [c.itemId]: { ...e, done: c.done, earned: c.done && mid === credit },
          };
        }
        next[c.week] = week;
      }
      return next;
    });
  }
}

/**
 * The planner's "outbox": imported items whose checkmark differs from the value
 * last seen in Home Center (`syncedCompleted`). Returns the writes to send and
 * `refs` identifying what to mark as sent afterwards.
 */
export function collectHomeCenterChanges(weeklyGoals) {
  const changes = [];
  const refs = [];
  for (const goal of weeklyGoals || []) {
    if (goal.source !== 'home-center') continue;
    const week = goal.remoteWeek || goal.weekKey;
    const tasks = goal.tasks || [];

    // A plain checkbox goal (no sub-items, not a tally).
    if (tasks.length === 0 && !goal.tally && !!goal.completed !== !!goal.syncedCompleted) {
      const done = !!goal.completed;
      changes.push({
        kind: 'item',
        week,
        itemId: goal.remoteId,
        done,
        habit: !!goal.habit,
        habitMembers: goal.habitMembers || [],
      });
      refs.push({ goalId: goal.id, value: done });
    }

    for (const task of tasks) {
      if (!task.remoteId) continue; // added by hand in the planner
      const subs = (task.subtasks || []).filter((st) => st.remoteId);
      const dirtySubs = subs.filter((st) => !!st.completed !== !!st.syncedCompleted);
      if (dirtySubs.length > 0) {
        for (const st of dirtySubs) {
          const done = !!st.completed;
          changes.push({ kind: 'child', week, ids: [st.remoteId], done });
          refs.push({ goalId: goal.id, taskId: task.id, subtaskId: st.id, value: done });
        }
      } else if (!!task.completed !== !!task.syncedCompleted) {
        // Checking a task that has subtasks checks (or clears) all of them,
        // the same as tapping that sub-item in Home Center.
        const done = !!task.completed;
        const ids = subs.length > 0 ? subs.map((st) => st.remoteId) : [task.remoteId];
        changes.push({ kind: 'child', week, ids, done });
        refs.push({ goalId: goal.id, taskId: task.id, value: done, cascade: subs.length > 0 });
      }
    }
  }
  return { changes, refs };
}
