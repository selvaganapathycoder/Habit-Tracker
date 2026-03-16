import { useState, useMemo } from 'react';

const STORAGE_KEY = 'habits-tracker-data';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getToday() {
  return formatDateKey(new Date());
}

function loadData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { habits: [], completions: {} };
  } catch {
    return { habits: [], completions: {} };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function calculateStreak(habitId, completions) {
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  const todayStr = getToday();
  const isTodayCompleted = completions[todayStr]?.includes(habitId);

  if (!isTodayCompleted) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (completions[dateStr]?.includes(habitId)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateBestStreak(habitId, completions) {
  const dates = Object.keys(completions).sort();
  if (dates.length === 0) return 0;

  let bestStreak = 0;
  let currentStreak = 0;
  let prevDate = null;

  for (const dateStr of dates) {
    if (completions[dateStr]?.includes(habitId)) {
      if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(dateStr);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prevDate = dateStr;
      bestStreak = Math.max(bestStreak, currentStreak);
    }
  }

  return bestStreak;
}

const HABIT_ICONS = [
  { id: 'exercise', icon: '🏃', label: 'Exercise' },
  { id: 'read', icon: '📚', label: 'Read' },
  { id: 'meditate', icon: '🧘', label: 'Meditate' },
  { id: 'water', icon: '💧', label: 'Drink Water' },
  { id: 'sleep', icon: '😴', label: 'Sleep Early' },
  { id: 'journal', icon: '✍️', label: 'Journal' },
  { id: 'code', icon: '💻', label: 'Code' },
  { id: 'learn', icon: '🎓', label: 'Learn' },
  { id: 'walk', icon: '🚶', label: 'Walk' },
  { id: 'healthy', icon: '🥗', label: 'Eat Healthy' },
  { id: 'stretch', icon: '🤸', label: 'Stretch' },
  { id: 'music', icon: '🎵', label: 'Practice Music' },
  { id: 'art', icon: '🎨', label: 'Create Art' },
  { id: 'clean', icon: '🧹', label: 'Clean' },
  { id: 'focus', icon: '🎯', label: 'Deep Focus' },
  { id: 'other', icon: '⭐', label: 'Other' },
];

function HeatmapCalendar({ habits, completions }) {
  const { days, weeks } = useMemo(() => {
    const today = new Date();
    const daysArray = [];

    // Go back ~11 weeks + remaining days to fill current week
    const totalDays = 77; // 11 weeks = 77 days

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDateKey(date);
      const dayCompletions = completions[dateStr] || [];
      const totalHabits = habits.length;
      const completedCount = dayCompletions.filter(id =>
        habits.some(h => h.id === id)
      ).length;

      let level = 0;
      if (totalHabits > 0 && completedCount > 0) {
        const rate = completedCount / totalHabits;
        if (rate <= 0.25) level = 1;
        else if (rate <= 0.5) level = 2;
        else if (rate <= 0.75) level = 3;
        else level = 4;
      }

      daysArray.push({
        date: dateStr,
        level,
        completed: completedCount,
        total: totalHabits,
        dayOfWeek: date.getDay(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
      });
    }

    // Group into weeks (columns)
    const weeksArray = [];
    let currentWeek = [];

    // Add empty cells for alignment at start
    const firstDayOfWeek = daysArray[0].dayOfWeek;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    daysArray.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeksArray.push(currentWeek);
    }

    return { days: daysArray, weeks: weeksArray };
  }, [habits, completions]);

  return (
    <div className="heatmap">
      <div className="heatmapWeeks">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmapWeek">
            {week.map((day, di) => (
              <div
                key={di}
                className={`heatmapCell ${day ? `level-${day.level}` : ''} ${day?.isToday ? 'today' : ''}`}
                data-empty={!day}
                title={day ? `${day.date}: ${day.completed}/${day.total}` : ''}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmapLegend">
        <span>Less</span>
        <div className="heatmapCell level-0" />
        <div className="heatmapCell level-1" />
        <div className="heatmapCell level-2" />
        <div className="heatmapCell level-3" />
        <div className="heatmapCell level-4" />
        <span>More</span>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [customName, setCustomName] = useState('');

  const today = getToday();
  const todayCompletions = data.completions[today] || [];

  const stats = useMemo(() => {
    const totalHabits = data.habits.length;
    const completedToday = todayCompletions.length;
    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    let totalCurrentStreak = 0;
    let bestOverallStreak = 0;

    data.habits.forEach((habit) => {
      const currentStreak = calculateStreak(habit.id, data.completions);
      const bestStreak = calculateBestStreak(habit.id, data.completions);
      totalCurrentStreak += currentStreak;
      bestOverallStreak = Math.max(bestOverallStreak, bestStreak);
    });

    return {
      totalHabits,
      completedToday,
      completionRate,
      avgStreak: totalHabits > 0 ? Math.round(totalCurrentStreak / totalHabits) : 0,
      bestStreak: bestOverallStreak,
    };
  }, [data, todayCompletions]);

  const updateData = (newData) => {
    setData(newData);
    saveData(newData);
  };

  const toggleHabit = (habitId) => {
    const newCompletions = { ...data.completions };
    const todayList = [...(newCompletions[today] || [])];

    if (todayList.includes(habitId)) {
      newCompletions[today] = todayList.filter((id) => id !== habitId);
    } else {
      newCompletions[today] = [...todayList, habitId];
    }

    updateData({ ...data, completions: newCompletions });
  };

  const addHabit = (e) => {
    e.preventDefault();
    if (!selectedIcon) return;

    const name = selectedIcon.id === 'other' ? customName.trim() : selectedIcon.label;
    if (!name) return;

    const newHabit = {
      id: generateId(),
      name,
      icon: selectedIcon.icon,
      createdAt: new Date().toISOString(),
    };

    updateData({ ...data, habits: [...data.habits, newHabit] });
    resetForm();
  };

  const deleteHabit = (habitId) => {
    const newHabits = data.habits.filter((h) => h.id !== habitId);
    const newCompletions = { ...data.completions };

    Object.keys(newCompletions).forEach((date) => {
      newCompletions[date] = newCompletions[date].filter((id) => id !== habitId);
    });

    updateData({ habits: newHabits, completions: newCompletions });
  };

  const resetForm = () => {
    setSelectedIcon(null);
    setCustomName('');
    setIsAdding(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Habits</h1>
        <p className="subtitle">{formatDate(today)}</p>
      </header>

      <main className="main">
        <div className="card statsCard">
          <div className="statGrid">
            <div className="stat primary">
              <span className="statValue streakValue">
                <span className="fireIcon">🔥</span>
                {stats.avgStreak}
              </span>
              <span className="statLabel">Day Streak</span>
            </div>
            <div className="stat">
              <span className="statValue">{stats.completedToday}/{stats.totalHabits}</span>
              <span className="statLabel">Today</span>
            </div>
            <div className="stat">
              <span className="statValue">{stats.completionRate}%</span>
              <span className="statLabel">Complete</span>
            </div>
            <div className="stat">
              <span className="statValue">{stats.bestStreak}</span>
              <span className="statLabel">Best</span>
            </div>
          </div>

          {stats.totalHabits > 0 && (
            <div className="progressContainer">
              <div className="progressBar">
                <div
                  className="progressFill"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {data.habits.length > 0 && (
          <div className="card heatmapCard">
            <h2 className="cardTitle">Activity</h2>
            <HeatmapCalendar habits={data.habits} completions={data.completions} />
          </div>
        )}

        <div className="card listCard">
          <div className="cardHeader">
            <h2 className="cardTitle">Daily Habits</h2>
            {!isAdding && (
              <button className="btn primary" onClick={() => setIsAdding(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add
              </button>
            )}
          </div>

          {isAdding && (
            <form className="form" onSubmit={addHabit}>
              <div className="formSection">
                <label className="label">Choose Habit</label>
                <div className="iconGrid">
                  {HABIT_ICONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`iconChip ${selectedIcon?.id === item.id ? 'selected' : ''}`}
                      onClick={() => setSelectedIcon(item)}
                    >
                      <span className="iconEmoji">{item.icon}</span>
                      <span className="iconLabel">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedIcon?.id === 'other' && (
                <div className="formGroup">
                  <label className="label">Habit Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter habit name..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div className="formActions">
                <button type="button" className="btn ghost" onClick={resetForm}>Cancel</button>
                <button
                  type="submit"
                  className="btn primaryLight"
                  disabled={!selectedIcon || (selectedIcon.id === 'other' && !customName.trim())}
                >
                  Add Habit
                </button>
              </div>
            </form>
          )}

          {data.habits.length === 0 && !isAdding ? (
            <div className="empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <p>No habits yet</p>
              <span>Add your first habit to start tracking</span>
            </div>
          ) : (
            <ul className="habitList">
              {data.habits.map((habit) => {
                const isCompleted = todayCompletions.includes(habit.id);
                const streak = calculateStreak(habit.id, data.completions);
                return (
                  <li key={habit.id} className={`habitItem ${isCompleted ? 'completed' : ''}`}>
                    <button
                      className={`checkBtn ${isCompleted ? 'checked' : ''}`}
                      onClick={() => toggleHabit(habit.id)}
                      aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isCompleted && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                    <span className="habitIcon">{habit.icon}</span>
                    <div className="habitInfo">
                      <span className="habitName">{habit.name}</span>
                      {streak > 0 && (
                        <span className="habitStreak">
                          🔥 {streak} day{streak !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <button
                      className="iconBtn danger"
                      onClick={() => deleteHabit(habit.id)}
                      aria-label="Delete habit"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </main>

      <footer className="credit">
        <span>Coded by <a href="https://github.com/selvaganapathycoder" target="_blank" rel="noopener noreferrer">Selvaganapathy</a></span>
      </footer>
    </div>
  );
}
