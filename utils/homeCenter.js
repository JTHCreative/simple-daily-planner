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

async function readDoc(key) {
  const res = await fetch(`${BASE}/${encodeURIComponent(key)}?key=${API_KEY}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Home Center returned ${res.status} for ${key}`);
  const body = await res.json();
  const raw = body?.fields?.json?.stringValue;
  return raw == null ? null : JSON.parse(raw);
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
