
import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, parseISO, differenceInMinutes } from 'date-fns';
import { Task, Note, WaterLog } from './types';
import { PlusIcon, TrashIcon, CheckIcon, LinkIcon, DropletIcon } from './components/Icons';

const App: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem('waterLogs');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Water Reminder State
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('remindersEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [lastWateredTime, setLastWateredTime] = useState<number>(() => {
    const saved = localStorage.getItem('lastWateredTime');
    return saved ? JSON.parse(saved) : Date.now();
  });
  const [showWaterReminder, setShowWaterReminder] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
  // New Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskType, setTaskType] = useState<'general' | 'scheduled'>('scheduled');

  // New Note Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Local Storage Sync
  useEffect(() => localStorage.setItem('tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('notes', JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem('waterLogs', JSON.stringify(waterLogs)), [waterLogs]);
  useEffect(() => localStorage.setItem('remindersEnabled', JSON.stringify(remindersEnabled)), [remindersEnabled]);
  useEffect(() => localStorage.setItem('lastWateredTime', JSON.stringify(lastWateredTime)), [lastWateredTime]);

  // Hourly Reminder Logic
  useEffect(() => {
    if (!remindersEnabled) return;

    const checkReminder = () => {
      const now = Date.now();
      const diffMinutes = differenceInMinutes(now, lastWateredTime);
      if (diffMinutes >= 60) {
        setShowWaterReminder(true);
      }
    };

    const interval = setInterval(checkReminder, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [remindersEnabled, lastWateredTime]);

  // Handlers
  const addTask = () => {
    if (!taskTitle.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskTitle,
      completed: false,
      category: taskType,
      date: taskType === 'scheduled' ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      time: taskType === 'scheduled' && taskTime ? taskTime : undefined,
      link: taskLink.trim() || undefined,
      createdAt: Date.now()
    };
    setTasks([...tasks, newTask]);
    resetTaskForm();
  };

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskTime('');
    setTaskLink('');
    setIsTaskModalOpen(false);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addNote = () => {
    if (!noteContent.trim() && !noteTitle.trim()) return;
    const colors = ['#fdf2f8', '#f0fdf4', '#eff6ff', '#fffbeb', '#f5f3ff'];
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: noteTitle || 'Untitled',
      content: noteContent,
      color: colors[Math.floor(Math.random() * colors.length)],
      updatedAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setNoteTitle('');
    setNoteContent('');
    setIsNoteModalOpen(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const updateWater = (increment: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = waterLogs.find(l => l.date === today);
    if (existing) {
      setWaterLogs(waterLogs.map(l => l.date === today ? { ...l, count: Math.max(0, l.count + increment) } : l));
    } else {
      setWaterLogs([...waterLogs, { date: today, count: Math.max(0, increment) }]);
    }
    
    if (increment > 0) {
      setLastWateredTime(Date.now());
      setShowWaterReminder(false);
    }
  };

  const todayWater = waterLogs.find(l => l.date === format(new Date(), 'yyyy-MM-dd'))?.count || 0;

  // Derived Data
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dailyTasks = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return tasks
      .filter(t => t.category === 'scheduled' && t.date === dateStr)
      .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
  }, [tasks, selectedDate]);

  const generalTasks = useMemo(() => {
    return tasks.filter(t => t.category === 'general');
  }, [tasks]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#fef7fb]">
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pink-500 tracking-tight">PastelPlans</h1>
          <p className="text-pink-300 font-medium text-sm md:text-base">Keep it cute, keep it organized ✨</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Reminder Toggle */}
          <button 
            onClick={() => setRemindersEnabled(!remindersEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
              remindersEnabled ? 'bg-blue-50 border-blue-200 text-blue-500' : 'bg-gray-50 border-gray-100 text-gray-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${remindersEnabled ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'}`} />
            {remindersEnabled ? 'Reminders On' : 'Reminders Off'}
          </button>

          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-pink-100 flex items-center gap-2">
            <DropletIcon className="w-5 h-5 text-blue-300" />
            <span className="font-semibold text-blue-400 text-sm md:text-base">{todayWater} glasses</span>
            <div className="flex gap-1 ml-1">
              <button onClick={() => updateWater(1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 transition text-blue-500 font-bold">+</button>
              <button onClick={() => updateWater(-1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-pink-50 hover:bg-pink-100 transition text-pink-400 font-bold">-</button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar & Inbox */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-700">{format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-pink-50 rounded-full text-pink-400 transition-colors">
                  &larr;
                </button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-pink-50 rounded-full text-pink-400 transition-colors">
                  &rarr;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-bold text-pink-300 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const hasTasks = tasks.some(t => t.category === 'scheduled' && t.date === format(day, 'yyyy-MM-dd'));
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative h-12 flex flex-col items-center justify-center rounded-xl text-sm transition-all
                      ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}
                      ${isSelected ? 'bg-pink-400 text-white shadow-md shadow-pink-100' : 'hover:bg-pink-50'}
                    `}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasTasks && !isSelected && (
                      <div className="absolute bottom-1 w-1 h-1 bg-pink-300 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* General Tasks List (Inbox) */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                Inbox
                <span className="text-xs bg-pink-50 text-pink-400 px-2 py-1 rounded-full">{generalTasks.length}</span>
              </h2>
              <button 
                onClick={() => { setTaskType('general'); setIsTaskModalOpen(true); }}
                className="p-1.5 bg-pink-50 rounded-full text-pink-400 hover:bg-pink-100 transition"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
              {generalTasks.length === 0 ? (
                <p className="text-center text-gray-400 italic text-sm py-4">No general tasks yet...</p>
              ) : (
                generalTasks.map(task => (
                  <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Daily View & Notes */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-700">{format(selectedDate, 'EEEE, MMM do')}</h2>
                <p className="text-sm text-gray-400">Daily Agenda</p>
              </div>
              <button 
                onClick={() => { setTaskType('scheduled'); setIsTaskModalOpen(true); }}
                className="flex items-center gap-2 bg-pink-400 hover:bg-pink-500 text-white px-4 py-2 rounded-2xl font-bold shadow-lg shadow-pink-100 transition"
              >
                <PlusIcon className="w-5 h-5" />
                Add Task
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
              {dailyTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <div className="w-16 h-16 mb-4 bg-pink-50 rounded-full flex items-center justify-center">☁️</div>
                  <p className="italic">Looks clear for today!</p>
                </div>
              ) : (
                dailyTasks.map(task => (
                  <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} showTime />
                ))
              )}
            </div>
          </section>

          {/* Notes Section */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-700">Quick Notes</h2>
              <button 
                onClick={() => setIsNoteModalOpen(true)}
                className="p-1.5 bg-green-50 rounded-full text-green-400 hover:bg-green-100 transition"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(note => (
                <div 
                  key={note.id} 
                  style={{ backgroundColor: note.color }}
                  className="p-4 rounded-2xl relative group border border-black/5"
                >
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-2 right-2 p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-gray-700 mb-1">{note.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="col-span-full text-center text-gray-400 text-sm py-4 italic">No notes found.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-100/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-pink-100 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-pink-500 mb-6 flex items-center gap-2">
              {taskType === 'scheduled' ? 'New Event 📅' : 'Inbox Task 📬'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-pink-300 uppercase mb-1">Task Title</label>
                <input 
                  autoFocus
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-3 rounded-2xl bg-pink-50/50 border border-transparent focus:border-pink-200 focus:bg-white outline-none transition"
                />
              </div>
              {taskType === 'scheduled' && (
                <div>
                  <label className="block text-xs font-bold text-pink-300 uppercase mb-1">Time (Optional)</label>
                  <input 
                    type="time"
                    value={taskTime}
                    onChange={e => setTaskTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-pink-50/50 border border-transparent focus:border-pink-200 focus:bg-white outline-none transition"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-pink-300 uppercase mb-1">Direct Link (Optional)</label>
                <input 
                  value={taskLink}
                  onChange={e => setTaskLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-2xl bg-pink-50/50 border border-transparent focus:border-pink-200 focus:bg-white outline-none transition"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={addTask}
                  className="flex-1 bg-pink-400 text-white py-3 rounded-2xl font-bold hover:bg-pink-500 transition shadow-lg shadow-pink-100"
                >
                  Create Task
                </button>
                <button 
                  onClick={resetTaskForm}
                  className="px-6 py-3 rounded-2xl font-bold text-gray-400 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-100/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-pink-100 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-green-500 mb-6">New Note 📝</h2>
            <div className="space-y-4">
              <input 
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                placeholder="Title..."
                className="w-full px-4 py-3 rounded-2xl bg-green-50/50 border border-transparent focus:border-green-200 focus:bg-white outline-none transition font-bold"
              />
              <textarea 
                rows={4}
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Write something sweet..."
                className="w-full px-4 py-3 rounded-2xl bg-green-50/50 border border-transparent focus:border-green-200 focus:bg-white outline-none transition resize-none"
              />
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={addNote}
                  className="flex-1 bg-green-400 text-white py-3 rounded-2xl font-bold hover:bg-green-500 transition shadow-lg shadow-green-100"
                >
                  Save Note
                </button>
                <button 
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-6 py-3 rounded-2xl font-bold text-gray-400 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Water Reminder Modal */}
      {showWaterReminder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-blue-100/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-blue-100 text-center animate-bounce duration-1000">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              💧
            </div>
            <h2 className="text-2xl font-bold text-blue-500 mb-2">Splash Time!</h2>
            <p className="text-gray-500 mb-8 font-medium">It's been an hour! Time to refresh your body with a nice glass of water. ☁️</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => updateWater(1)}
                className="w-full bg-blue-400 text-white py-4 rounded-2xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-100 text-lg"
              >
                I drank water! ✨
              </button>
              <button 
                onClick={() => { setShowWaterReminder(false); setLastWateredTime(Date.now()); }}
                className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition"
              >
                Remind me in 15 mins
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <button 
        onClick={() => { setTaskType('scheduled'); setIsTaskModalOpen(true); }}
        className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-pink-200 z-40 transition active:scale-90"
      >
        <PlusIcon className="w-8 h-8" />
      </button>
    </div>
  );
};

// Helper Components
interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  showTime?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, showTime }) => {
  return (
    <div className={`
      group flex items-center gap-4 p-4 rounded-2xl border transition-all
      ${task.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-pink-50 hover:shadow-md hover:border-pink-100'}
    `}>
      <button 
        onClick={() => onToggle(task.id)}
        className={`
          flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors
          ${task.completed ? 'bg-green-400 border-green-400 text-white' : 'border-pink-200 hover:border-pink-400 text-transparent'}
        `}
      >
        <CheckIcon />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {showTime && task.time && (
            <span className="text-xs font-bold text-pink-300 whitespace-nowrap">{task.time}</span>
          )}
          <h3 className={`font-semibold truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
            {task.title}
          </h3>
        </div>
        {task.link && (
          <a 
            href={task.link.startsWith('http') ? task.link : `https://${task.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon className="w-3 h-3" />
            Link Attached
          </a>
        )}
      </div>

      <button 
        onClick={() => onDelete(task.id)}
        className="p-2 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default App;
