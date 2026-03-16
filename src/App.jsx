import { useState, useMemo, useEffect } from 'react';
import { 
  Activity, BookOpen, Flame, Droplets, Moon, 
  PenTool, Code2, GraduationCap, Footprints, 
  Salad, Flower2, Music, Palette, 
  Sparkles, Target, Star, Trash2, Plus, Check, ChevronRight
} from 'lucide-react';

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
  { id: 'exercise', icon: Activity, color: '#ec4899', label: 'Exercise' },
  { id: 'read', icon: BookOpen, color: '#3b82f6', label: 'Read' },
  { id: 'meditate', icon: Flower2, color: '#8b5cf6', label: 'Meditate' },
  { id: 'water', icon: Droplets, color: '#0ea5e9', label: 'Drink Water' },
  { id: 'sleep', icon: Moon, color: '#6366f1', label: 'Sleep Early' },
  { id: 'journal', icon: PenTool, color: '#10b981', label: 'Journal' },
  { id: 'code', icon: Code2, color: '#f59e0b', label: 'Code' },
  { id: 'learn', icon: GraduationCap, color: '#f43f5e', label: 'Learn' },
  { id: 'walk', icon: Footprints, color: '#14b8a6', label: 'Walk' },
  { id: 'healthy', icon: Salad, color: '#22c55e', label: 'Eat Healthy' },
  { id: 'music', icon: Music, color: '#d946ef', label: 'Music' },
  { id: 'art', icon: Palette, color: '#eab308', label: 'Create Art' },
  { id: 'clean', icon: Sparkles, color: '#06b6d4', label: 'Clean' },
  { id: 'focus', icon: Target, color: '#ef4444', label: 'Deep Focus' },
  { id: 'other', icon: Star, color: '#a855f7', label: 'Other' },
];

function HeatmapCalendar({ habits, completions }) {
  const { days, weeks } = useMemo(() => {
    const today = new Date();
    const daysArray = [];

    // Go back ~11 weeks + remaining days to fill current week
    const totalDays = 77;

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

    const weeksArray = [];
    let currentWeek = [];

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      iconId: selectedIcon.id,
      color: selectedIcon.color,
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!mounted) return null;

  return (
    <div className="app">
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>
      
      <header className="header">
        <div className="headerTop">
          <div className="dateChip">
            {formatDate(today)}
          </div>
        </div>
        <h1 className="title">Daily Overview</h1>
        <p className="subtitle">Stay consistent, build momentum.</p>
      </header>

      <main className="main">
        <div className="card statsCard glass">
          <div className="statGrid">
            <div className="stat primary">
              <span className="statValue streakValue">
                <Flame className="fireIcon" />
                {stats.avgStreak}
              </span>
              <span className="statLabel">Avg Day Streak</span>
            </div>
            <div className="statGroup">
              <div className="stat">
                <span className="statValue">{stats.completedToday}/{stats.totalHabits}</span>
                <span className="statLabel">Today</span>
              </div>
              <div className="stat">
                <span className="statValue highlight">{stats.completionRate}%</span>
                <span className="statLabel">Complete</span>
              </div>
              <div className="stat">
                <span className="statValue highlight-2">{stats.bestStreak}</span>
                <span className="statLabel">Best Streak</span>
              </div>
            </div>
          </div>

          <div className="progressContainer">
            <div className="progressBar">
              <div
                className="progressFill"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {data.habits.length > 0 && (
          <div className="card heatmapCard glass">
            <div className="cardHeader">
              <h2 className="cardTitle">Consistency Heatmap</h2>
            </div>
            <HeatmapCalendar habits={data.habits} completions={data.completions} />
          </div>
        )}

        <div className="card listCard glass">
          <div className="cardHeader">
            <h2 className="cardTitle">Your Habits</h2>
            {!isAdding && (
              <button className="btn primaryLight" onClick={() => setIsAdding(true)}>
                <Plus size={16} />
                <span>New Habit</span>
              </button>
            )}
          </div>

          {isAdding && (
            <form className="form glass-form" onSubmit={addHabit}>
              <div className="formSection">
                <label className="label">Choose a Habit</label>
                <div className="iconGrid">
                  {HABIT_ICONS.map((item) => {
                    const isSelected = selectedIcon?.id === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`iconChip ${isSelected ? 'selected' : ''}`}
                        style={{ '--icon-color': item.color }}
                        onClick={() => setSelectedIcon(item)}
                      >
                        <div className="iconEmojiContainer" style={{ color: isSelected ? '#fff' : item.color }}>
                           <IconComp size={24} />
                        </div>
                        <span className="iconLabel">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedIcon?.id === 'other' && (
                <div className="formGroup">
                  <label className="label">Habit Name</label>
                  <input
                    type="text"
                    className="input base-input"
                    placeholder="E.g. Call family, Code for 1 hour..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div className="formActions mt-6">
                <button type="button" className="btn ghost" onClick={resetForm}>Cancel</button>
                <button
                  type="submit"
                  className="btn primaryLight"
                  disabled={!selectedIcon || (selectedIcon.id === 'other' && !customName.trim())}
                >
                  Create Habit <ChevronRight size={16} />
                </button>
              </div>
            </form>
          )}

          {data.habits.length === 0 && !isAdding ? (
            <div className="empty">
              <div className="emptyIconWrapper">
                <Sparkles size={32} />
              </div>
              <p>No habits yet</p>
              <span>Build extraordinary routines starting today.</span>
              <button className="btn outline mt-4" onClick={() => setIsAdding(true)}>
                Create First Habit
              </button>
            </div>
          ) : (
            <ul className="habitList">
              {data.habits.map((habit) => {
                const isCompleted = todayCompletions.includes(habit.id);
                const streak = calculateStreak(habit.id, data.completions);
                const iconData = HABIT_ICONS.find(h => h.id === habit.iconId) || HABIT_ICONS[0];
                const IconComp = iconData.icon;
                
                return (
                  <li key={habit.id} className={`habitItem ${isCompleted ? 'completed' : ''}`}>
                    <button
                      className={`checkBtn ${isCompleted ? 'checked' : ''}`}
                      style={{ '--check-color': habit.color }}
                      onClick={() => toggleHabit(habit.id)}
                      aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isCompleted && <Check size={18} strokeWidth={3} />}
                    </button>
                    
                    <div className="habitIconWrapper" style={{ backgroundColor: `${habit.color}15`, color: habit.color }}>
                      <IconComp size={20} />
                    </div>
                    
                    <div className="habitInfo">
                      <span className="habitName">{habit.name}</span>
                      {streak > 0 && (
                        <div className="habitStreakWrapper">
                          <span className="habitStreak">
                            🔥 {streak} Day Streak
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      className="iconBtn danger"
                      onClick={() => deleteHabit(habit.id)}
                      aria-label="Delete habit"
                    >
                       <Trash2 size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </main>
      
      <footer className="credit">
        <span>Designed by <a href="https://github.com/selvaganapathycoder" target="_blank" rel="noopener noreferrer">Selvaganapathy</a></span>
      </footer>
    </div>
  );
}
