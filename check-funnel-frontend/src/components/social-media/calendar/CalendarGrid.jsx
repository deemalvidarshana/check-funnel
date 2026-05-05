import React, { useState } from 'react';
import CalendarDay from './CalendarDay';
import CalendarPost from './CalendarPost';
import PostDetailsModal from './PostDetailsModal';

const CalendarGrid = ({ view }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const daysInMonth = 29; // Feb 2024
  const startDay = 4; // Starts on Thursday

  const posts = [
    { 
      day: 1, 
      type: 'Published', 
      title: 'Poya Day Greeting', 
      pillar: 'Poya Content', 
      contentType: 'Static', 
      time: '09:00 AM',
      visualCopy: 'May this Poya Day be a moment to pause and reflect.',
      caption: 'Wishing you peace and mindfulness today 🙏 #PoyaDay #Mindfulness',
      icon: 'temple_buddhist'
    },
    { 
      day: 5, 
      type: 'Published', 
      title: 'Unexpected Expenses', 
      pillar: 'Risk & Life Event Triggers', 
      contentType: 'Static', 
      time: '10:30 AM',
      visualCopy: 'Did you know? 70% of families face unexpected expenses yearly',
      caption: 'Planning ahead reduces stress and surprises 💡 #RelianceInsuranceBrokers',
      icon: 'savings'
    },
    { 
      day: 14, 
      type: 'Published', 
      title: 'Valentine\'s Special', 
      pillar: 'Risk & Life Event Triggers', 
      contentType: 'Static', 
      time: '03:15 PM',
      visualCopy: 'Roses fade. Plans don\'t. Love your people, plan ahead',
      caption: 'This Valentine\'s, show love the smart way! It\'s not just about flowers, it\'s about being there when it matters most 💙 #RelianceInsuranceBrokers #Valentines',
      icon: 'favorite'
    },
    { 
      day: 25, 
      type: 'Published', 
      title: 'Myth vs Fact Reel', 
      pillar: 'Educational Content', 
      contentType: 'Reel', 
      time: '06:00 PM',
      visualCopy: 'Myth vs Fact: Insurance Edition',
      caption: 'Some myths are hard to shake! Planning ahead isn\'t complicated; it just takes small, simple steps 👊 #InsuranceFacts #MythBuster',
      icon: 'movie'
    },
  ];

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const renderDays = () => {
    const days = [];
    
    if (view === 'month') {
      // Empty days from previous month
      for (let i = 0; i < startDay; i++) {
        days.push(<CalendarDay key={`prev-${i}`} isCurrentMonth={false} day={28 + i} view={view} />);
      }

      // Days of current month
      for (let d = 1; d <= daysInMonth; d++) {
        const dayPosts = posts.filter(p => p.day === d);
        days.push(
          <CalendarDay key={d} day={d} isToday={d === 9} isCurrentMonth={true} view={view}>
            {dayPosts.map((post, idx) => (
              <div key={idx} onClick={(e) => { e.stopPropagation(); handlePostClick(post); }}>
                <CalendarPost {...post} view={view} />
              </div>
            ))}
          </CalendarDay>
        );
      }
    } else {
      // Week view: Feb 4 to Feb 10
      for (let d = 4; d <= 10; d++) {
        const dayPosts = posts.filter(p => p.day === d);
        days.push(
          <CalendarDay key={d} day={d} isToday={d === 9} isCurrentMonth={true} view={view}>
            {dayPosts.map((post, idx) => (
              <div key={idx} onClick={(e) => { e.stopPropagation(); handlePostClick(post); }}>
                <CalendarPost {...post} view={view} />
              </div>
            ))}
          </CalendarDay>
        );
      }
    }

    return days;
  };

  return (
    <div className="bg-slate-50/50 p-2 sm:p-6 rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col">
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[850px] lg:min-w-0">
          <div className="grid grid-cols-7 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center py-2">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">{day}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {renderDays()}
          </div>
        </div>
      </div>

      <PostDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        post={selectedPost} 
      />
    </div>
  );
};

export default CalendarGrid;
