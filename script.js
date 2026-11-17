const seedGoals = [
  { id: 1, name: 'New camera', saved: 620, target: 1000, dueDate: '2026-12-15', kind: 'tree', icon: '🌳' },
  { id: 2, name: 'Weekend away', saved: 360, target: 500, dueDate: '2026-11-30', kind: 'bean', icon: '🌱' },
  { id: 3, name: 'Rainy day fund', saved: 260, target: 1000, dueDate: '2027-01-31', kind: 'flower', icon: '🌻' }
];
const seedActivity = [
  { goal: 'Weekend away', amount: 40, date: 'Today, 9:41 AM', timestamp: '2026-11-09T09:41:00', icon: '💧' },
  { goal: 'New camera', amount: 80, date: 'Yesterday', timestamp: '2026-11-08T10:15:00', icon: '☀' },
  { goal: 'Rainy day fund', amount: 60, date: 'Oct 29', timestamp: '2026-10-29T16:20:00', icon: '💧' }
];
let goals = JSON.parse(localStorage.getItem('sprout-goals')) || seedGoals;
let activities = JSON.parse(localStorage.getItem('sprout-activity')) || seedActivity;
const $ = (selector) => document.querySelector(selector);
const money = (value) => `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const signedMoney = (value) => value < 0 ? `−${money(Math.abs(value))}` : money(value);
function getDeadlineStatus(goal) {
  if (!goal.dueDate) return { state: 'none', days: null, label: '' };
  const due = new Date(`${goal.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((due - today) / 86400000);
  if (days < 0) return { state: 'past', days, label: 'The deadline has passed' };
  if (days <= 7) return { state: 'critical', days, label: days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} remaining` };
  if (days <= 30) return { state: 'warning', days, label: `The deadline is in ${days} days` };
  return { state: 'normal', days, label: '' };
}
function plantVisual(goal, percent, deadline) {
  if (goal.kind === 'tree') {
    if (deadline.state === 'past') return '<img class="plant-sprite dead-tree" src="assets/dead-tree.png" alt="Dead tree" />';
    return percent > 33 ? '<img class="plant-sprite mature-tree" src="assets/mature-tree.png" alt="Mature tree" />' : '<img class="plant-sprite living-tree" src="assets/living-tree.png" alt="Living tree" />';
  }
  if (goal.kind === 'bean' && deadline.state === 'past') return '<img class="plant-sprite dead-beanstalk" src="assets/dead-beanstalk.png" alt="Dead beanstalk" />';
  if (goal.kind === 'flower' && deadline.state === 'past') return '<img class="plant-sprite dead-sunflower" src="assets/dead-sunflower.png" alt="Dead sunflower" />';
  if (goal.kind === 'bean') return percent > 33 ? '<img class="plant-sprite older-beanstalk" src="assets/older-beanstalk.png" alt="Older beanstalk" />' : '<img class="plant-sprite living-beanstalk" src="assets/beanstalk.png" alt="Beanstalk" />';
  if (goal.kind === 'flower') return percent > 33 ? '<img class="plant-sprite mature-sunflower" src="assets/mature-sunflower.png" alt="Mature sunflower" />' : '<img class="plant-sprite living-sunflower" src="assets/living-sunflower.png" alt="Living sunflower" />';
  return `<span class="plant-emoji" aria-hidden="true">${goal.icon}</span>`;
}
const formatDueDate = (value) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
function save() { localStorage.setItem('sprout-goals', JSON.stringify(goals)); localStorage.setItem('sprout-activity', JSON.stringify(activities)); }
function activityDate(activity) {
  if (activity.timestamp) return new Date(activity.timestamp);
  const now = new Date();
  if (activity.date === 'Today' || activity.date?.startsWith('Today,')) return now;
  if (activity.date === 'Yesterday') { now.setDate(now.getDate() - 1); return now; }
  const parsed = new Date(`${activity.date}, ${now.getFullYear()}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function render() {
  const selectedGoal = $('#goal-select')?.value;
  const selectedWithdrawGoal = $('#withdraw-goal')?.value;
  const total = goals.reduce((sum, goal) => sum + goal.saved, 0);
  $('#total-saved').textContent = money(total); $('#goal-count').textContent = goals.length;
  const now = new Date();
  const monthSaved = activities.reduce((sum, activity) => { const date = activityDate(activity); return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? sum + activity.amount : sum; }, 0);
  $('#month-growth').textContent = signedMoney(monthSaved);
  $('#month-growth').parentElement.classList.toggle('positive', monthSaved >= 0);
  $('#month-growth').parentElement.classList.toggle('negative', monthSaved < 0);
  const next = goals.filter(goal => goal.dueDate && goal.saved < goal.target).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  $('#next-milestone').textContent = next ? money(next.target - next.saved) : '—';
  $('#next-milestone-note').textContent = next ? `For ${next.name}, by ${formatDueDate(next.dueDate)}` : 'Add a due date to see what comes next.';
  $('#plant-list').innerHTML = goals.map(goal => { const percent = Math.min(100, Math.round(goal.saved / goal.target * 100)); const dueDate = formatDueDate(goal.dueDate); const deadline = getDeadlineStatus(goal); const alert = deadline.state === 'none' || deadline.state === 'normal' ? '' : `<div class="deadline-alert ${deadline.state}">${deadline.state === 'critical' ? '⚠' : deadline.state === 'past' ? '✕' : '◷'} ${deadline.label}</div>`; return `<div class="goal-item deadline-${deadline.state}"><article class="plant-card" data-kind="${goal.kind}" data-id="${goal.id}" tabindex="0"><div class="plant-art">${plantVisual(goal, percent, deadline)}</div><div class="plant-info"><div class="plant-meta"><span class="plant-name">${escapeHTML(goal.name)}</span><span class="plant-target">${money(goal.saved)} / ${money(goal.target)}</span></div><div class="progress-row"><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><span class="progress-percent">${percent}%</span></div><div class="plant-bottom"><span>${percent >= 100 ? '<span class="ready">Ready to bloom ✦</span>' : `${money(goal.target - goal.saved)} remaining`}</span><span>${dueDate ? `Due ${dueDate}` : (percent >= 100 ? 'Goal reached' : 'No due date yet')}</span></div>${alert}</div></article><div class="goal-actions"><button class="edit-goal" type="button" data-id="${goal.id}">Edit goal <span>↗</span></button><button class="delete-goal" type="button" data-id="${goal.id}">Delete goal <span>×</span></button><button class="view-goal" type="button" data-id="${goal.id}">View goal <span>⊙</span></button></div></div>`; }).join('');
  const options = goals.map(g => `<option value="${g.id}">${escapeHTML(g.name)}</option>`).join('');
  $('#goal-select').innerHTML = options;
  $('#withdraw-goal').innerHTML = options;
  if (selectedGoal && goals.some(goal => String(goal.id) === selectedGoal)) $('#goal-select').value = selectedGoal;
  if (selectedWithdrawGoal && goals.some(goal => String(goal.id) === selectedWithdrawGoal)) $('#withdraw-goal').value = selectedWithdrawGoal;
  $('#activity-list').innerHTML = activities.slice(0, 5).map(item => `<div class="activity-item"><span class="activity-icon ${item.amount < 0 ? 'minus' : ''}">${item.amount < 0 ? '☀' : item.icon || '💧'}</span><div class="activity-copy">${escapeHTML(item.goal)}<small>${item.date}</small></div><span class="activity-amount ${item.amount < 0 ? 'minus' : ''}">${item.amount < 0 ? '−' : '+'}${money(Math.abs(item.amount))}</span></div>`).join('') || '<p class="form-hint">Your garden is waiting for its first little bit of care.</p>';
}
function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char])); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); }
function animatePlant(id) { const card = document.querySelector(`[data-id="${id}"] .plant-emoji`); if (card) { card.classList.remove('celebrate'); void card.offsetWidth; card.classList.add('celebrate'); } }
let editingGoalId = null;
let deletingGoalId = null;
$('#plant-list').addEventListener('click', (event) => {
  const viewButton = event.target.closest('.view-goal');
  if (viewButton) {
    const goal = goals.find(item => String(item.id) === viewButton.dataset.id);
    if (!goal) return;
    const percent = Math.min(100, Math.round(goal.saved / goal.target * 100));
    const deadline = getDeadlineStatus(goal);
    const isDead = deadline.state === 'past' && (goal.kind === 'tree' || goal.kind === 'bean' || goal.kind === 'flower');
    const isMature = goal.kind === 'tree' && !isDead && percent > 33;
    const isMatureFlower = goal.kind === 'flower' && !isDead && percent > 33;
    const sprite = $('#view-plant-sprite');
    const emoji = $('#view-plant-emoji');
    const isTree = goal.kind === 'tree';
    const isSpritePlant = isTree || goal.kind === 'bean' || goal.kind === 'flower' || isDead;
    sprite.hidden = !isSpritePlant;
    emoji.hidden = isSpritePlant;
    const isOlderBean = goal.kind === 'bean' && percent > 33;
    sprite.src = isSpritePlant ? (isDead ? (isTree ? 'assets/dead-tree.png' : goal.kind === 'bean' ? 'assets/dead-beanstalk.png' : 'assets/dead-sunflower.png') : (isTree ? (isMature ? 'assets/mature-tree.png' : 'assets/living-tree.png') : goal.kind === 'bean' ? (isOlderBean ? 'assets/older-beanstalk.png' : 'assets/beanstalk.png') : (isMatureFlower ? 'assets/mature-sunflower.png' : 'assets/living-sunflower.png'))) : '';
    sprite.alt = isDead ? (isTree ? 'Dead tree' : goal.kind === 'bean' ? 'Dead beanstalk' : 'Dead sunflower') : (isTree ? 'Living tree' : goal.kind === 'bean' ? (isOlderBean ? 'Older beanstalk' : 'Beanstalk') : (isMatureFlower ? 'Mature sunflower' : 'Living sunflower'));
    sprite.className = `view-plant-sprite ${isDead ? (isTree ? 'dead-tree' : goal.kind === 'bean' ? 'dead-beanstalk' : 'dead-sunflower') : (isTree ? 'living-tree' : goal.kind === 'bean' ? (isOlderBean ? 'older-beanstalk' : 'living-beanstalk') : (isMatureFlower ? 'mature-sunflower' : 'living-sunflower'))}`;
    emoji.textContent = isTree ? '' : goal.icon;
    $('#view-goal-name').textContent = goal.name;
    $('#view-goal-status').textContent = deadline.state === 'past' ? `The deadline has passed, and ${goal.kind === 'tree' ? 'your tree has withered' : goal.kind === 'bean' ? 'your beanstalk has wilted' : goal.kind === 'flower' ? 'your sunflower has wilted' : 'this goal is past due'}.` : (deadline.state === 'critical' ? `${percent}% grown, with ${deadline.label.toLowerCase()}.` : (goal.kind === 'tree' ? `${percent}% grown, and ${isMature ? 'your tree is flourishing' : 'your sapling is taking root'}.` : `${percent}% grown.`));
    $('#view-dialog').showModal();
    return;
  }
  const deleteButton = event.target.closest('.delete-goal');
  if (deleteButton) {
    const goal = goals.find(item => String(item.id) === deleteButton.dataset.id);
    if (!goal) return;
    deletingGoalId = goal.id;
    $('#delete-goal-name').textContent = goal.name;
    $('#delete-dialog').showModal();
    return;
  }
  const editButton = event.target.closest('.edit-goal');
  if (editButton) {
    const goal = goals.find(item => String(item.id) === editButton.dataset.id);
    if (!goal) return;
    editingGoalId = goal.id;
    $('#edit-goal-name').value = goal.name;
    $('#edit-goal-target').value = goal.target;
    $('#edit-goal-due-date').value = goal.dueDate || '';
    $('#edit-dialog').showModal();
    return;
  }
  const card = event.target.closest('.plant-card');
  if (!card) return;
  const item = card.closest('.goal-item');
  document.querySelectorAll('.goal-item.is-open').forEach(openItem => { if (openItem !== item) openItem.classList.remove('is-open'); });
  item.classList.toggle('is-open');
});
$('#log-form').addEventListener('submit', (event) => { event.preventDefault(); const amount = Number($('#amount').value); const id = Number($('#goal-select').value); const goal = goals.find(g => g.id === id); if (!amount || !goal) return; goal.saved += amount; activities.unshift({ goal: goal.name, amount, date: 'Just now', timestamp: new Date().toISOString(), icon: '💧' }); save(); render(); animatePlant(id); showToast(`${money(amount)} has been added to ${goal.name}. Your plant is getting stronger.`); event.target.reset(); $('#goal-select').value = String(id); });
$('#withdraw-toggle').addEventListener('click', () => { $('#withdraw-form').classList.toggle('is-hidden'); });
$('#withdraw-form').addEventListener('submit', (event) => { event.preventDefault(); const amount = Number($('#withdraw-amount').value); const id = Number($('#withdraw-goal').value); const goal = goals.find(g => g.id === id); if (!amount || !goal) return; goal.saved = Math.max(0, goal.saved - amount); activities.unshift({ goal: goal.name, amount: -amount, date: 'Just now', timestamp: new Date().toISOString(), icon: '☀' }); save(); render(); showToast(`You withdrew ${money(amount)} from ${goal.name}. Keep an eye on its growth.`); event.target.reset(); $('#withdraw-goal').value = String(id); });
$('#open-goal').addEventListener('click', () => $('#goal-dialog').showModal());
$('#goal-dialog .close-dialog').addEventListener('click', () => { $('#goal-dialog').close(); $('#goal-form').reset(); });
$('#goal-form').addEventListener('submit', (event) => { event.preventDefault(); const name = $('#goal-name').value.trim(); const target = Number($('#goal-target').value); const dueDate = $('#goal-due-date').value; const kind = document.querySelector('input[name="plant"]:checked').value; if (!name || !target) return; const icon = { tree:'🌳', bean:'🌱', flower:'🌻' }[kind]; goals.push({ id: Date.now(), name, target, dueDate, saved: 0, kind, icon }); save(); render(); $('#goal-dialog').close(); $('#goal-form').reset(); showToast(`${name} is ready to grow.`); });
$('#edit-dialog .close-dialog').addEventListener('click', () => $('#edit-dialog').close());
$('#edit-form').addEventListener('submit', (event) => { event.preventDefault(); const goal = goals.find(item => item.id === editingGoalId); const target = Number($('#edit-goal-target').value); if (!goal || !target) return; goal.name = $('#edit-goal-name').value.trim(); goal.target = target; goal.dueDate = $('#edit-goal-due-date').value; save(); render(); $('#edit-dialog').close(); showToast(`${goal.name} has been updated.`); });
$('#cancel-delete').addEventListener('click', () => $('#delete-dialog').close());
$('#keep-goal').addEventListener('click', () => $('#delete-dialog').close());
$('#delete-form').addEventListener('submit', (event) => { event.preventDefault(); const goal = goals.find(item => item.id === deletingGoalId); if (!goal) return; goals = goals.filter(item => item.id !== deletingGoalId); save(); render(); $('#delete-dialog').close(); showToast(`${goal.name} has been removed from your garden.`); deletingGoalId = null; });
render();
