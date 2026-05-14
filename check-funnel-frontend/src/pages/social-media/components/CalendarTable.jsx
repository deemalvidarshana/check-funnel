import React, { useState, useEffect, useRef } from 'react';

const EditableCell = ({ value, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const textareaRef = useRef(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleInput = (e) => {
    setCurrentValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <td className={`p-0 border-r border-slate-100 bg-white shadow-[0_0_0_2px_#003870_inset] z-30 relative`}>
        <textarea
          ref={textareaRef}
          value={currentValue}
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full p-6 bg-transparent outline-none border-none resize-none text-slate-800 font-semibold leading-relaxed overflow-hidden block"
        />
      </td>
    );
  }

  return (
    <td 
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-text hover:bg-blue-50/30 transition-colors group/cell relative`}
    >
      {value}
      <span className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 material-symbols-outlined text-[12px] text-slate-300">edit</span>
    </td>
  );
};

const DropdownCell = ({ value, options, onSave, className, renderDisplay }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    onSave(e.target.value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <td className="px-4 py-3 border-r border-slate-100 bg-white z-30 relative">
        <select 
          autoFocus
          value={value}
          onChange={handleChange}
          onBlur={() => setIsEditing(false)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870]"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
    );
  }

  return (
    <td 
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-pointer hover:bg-blue-50/30 transition-colors group/cell relative`}
    >
      {renderDisplay ? renderDisplay(value) : value}
      <span className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 material-symbols-outlined text-[12px] text-slate-300">expand_more</span>
    </td>
  );
};

const DateCell = ({ value, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  const formatDisplayDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' });
      return `${day}-${month}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getInputValue = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        const parts = dateStr.split('-');
        if (parts.length === 2) {
          const d = new Date(`${parts[1]} ${parts[0]}, ${new Date().getFullYear()}`);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleChange = (e) => {
    if (e.target.value) {
      onSave(e.target.value);
      setIsEditing(false);
    }
  };

  return (
    <td 
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-pointer hover:bg-blue-50/30 transition-colors group/cell relative min-w-[120px]`}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover/cell:text-[#003870] transition-colors">calendar_today</span>
        <span className="font-medium text-slate-700">{formatDisplayDate(value)}</span>
      </div>
      
      {isEditing && (
        <div className="absolute inset-0 bg-white z-50 flex items-center px-2">
          <input 
            ref={inputRef}
            type="date"
            autoFocus
            defaultValue={getInputValue(value)}
            onChange={handleChange}
            onBlur={() => setIsEditing(false)}
            className="w-full text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#003870]"
          />
        </div>
      )}
      <span className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 material-symbols-outlined text-[12px] text-slate-300">edit</span>
    </td>
  );
};

const CalendarTable = ({ data, onAiEdit, onDeleteRow, onUpdateRow, onViewRow, getStatusColor, editingIndex }) => {
  const contentTypeOptions = [
    { value: 'Video', label: 'Video' },
    { value: 'Reel', label: 'Reel' },
    { value: 'Carousel', label: 'Carousel' },
    { value: 'Static', label: 'Static' }
  ];

  const statusOptions = [
    { value: 'DRAFT', label: 'DRAFT' },
    { value: 'SCHEDULED', label: 'SCHEDULED' },
    { value: 'PUBLISHED', label: 'PUBLISHED' }
  ];

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'Video':
      case 'Reel':
        return 'play_circle';
      case 'Carousel':
        return 'view_carousel';
      default:
        return 'image';
    }
  };

  return (
    <table className="w-full text-left text-sm border-collapse table-fixed">
      <thead className="bg-slate-50/80 sticky top-0 z-40 shadow-sm">
        <tr>
          <th className="w-[120px] px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Date</th>
          <th className="w-[140px] px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Type</th>
          <th className="w-[180px] px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Pillar</th>
          <th className="w-[220px] px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Visual Copy</th>
          <th className="w-[400px] px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Caption</th>
          <th className="w-[140px] px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Status</th>
          <th className="w-[100px] px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100 text-center">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {data.map((row, i) => (
          <tr 
            key={i} 
            className={`transition-all group align-top ${editingIndex === i ? 'bg-blue-50/80 ring-2 ring-inset ring-[#003870]/20 z-20 relative' : 'hover:bg-slate-50/80'}`}
          >
            <DateCell 
              value={row.date}
              onSave={(val) => onUpdateRow(i, { date: val })}
              className="px-6 py-4 border-r border-slate-100 whitespace-nowrap"
            />
            
            <DropdownCell 
              value={row.contentType}
              options={contentTypeOptions}
              onSave={(val) => onUpdateRow(i, { contentType: val })}
              className="px-6 py-4 border-r border-slate-100"
              renderDisplay={(val) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${editingIndex === i ? 'bg-white text-[#003870]' : 'bg-slate-100 text-slate-700'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {getContentTypeIcon(val)}
                  </span>
                  {val}
                </span>
              )}
            />
            
            <EditableCell 
              value={row.pillar} 
              onSave={(val) => onUpdateRow(i, { pillar: val })}
              className="px-6 py-4 font-bold text-[#003870] border-r border-slate-100 whitespace-pre-wrap leading-tight"
            />
            
            <EditableCell 
              value={row.visualCopy || row.visual} 
              onSave={(val) => onUpdateRow(i, { visualCopy: val, visual: val })}
              className="px-6 py-4 text-slate-800 font-semibold border-r border-slate-100 whitespace-pre-wrap leading-relaxed break-words"
            />

            <EditableCell 
              value={row.caption} 
              onSave={(val) => onUpdateRow(i, { caption: val })}
              className="px-6 py-4 text-slate-50 font-medium border-r border-slate-100 whitespace-pre-wrap leading-relaxed break-words !text-slate-500"
            />

            <DropdownCell 
              value={row.status}
              options={statusOptions}
              onSave={(val) => onUpdateRow(i, { status: val })}
              className="px-6 py-4 border-r border-slate-100"
              renderDisplay={(val) => (
                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold border uppercase tracking-widest ${getStatusColor(val)}`}>
                  {val}
                </span>
              )}
            />

            <td className="px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <button 
                  onClick={() => onViewRow && onViewRow(i)}
                  className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-[#003870] hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95 group"
                  title="View Details"
                >
                  <span className="material-symbols-outlined text-[20px] block">visibility</span>
                </button>
                <button 
                  onClick={() => onDeleteRow(i)}
                  className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95 group"
                  title="Delete Row"
                >
                  <span className="material-symbols-outlined text-[20px] block">delete</span>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CalendarTable;
