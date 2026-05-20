import React, { useState, useEffect, useRef } from 'react';

const EditableCell = ({ value, onSave, className, readOnly = false }) => {
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

  if (readOnly) {
    return (
      <td className={`${className} relative`}>
        {value}
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

const DropdownCell = ({ value, options, onSave, className, renderDisplay, readOnly = false }) => {
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

  if (readOnly) {
    return (
      <td className={`${className} relative`}>
        {renderDisplay ? renderDisplay(value) : value}
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

const DateCell = ({ value, onSave, className, readOnly = false }) => {
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

  if (readOnly) {
    return (
      <td className={`${className} relative min-w-[120px]`}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-300 text-[16px]">calendar_today</span>
          <span className="font-medium text-slate-700">{formatDisplayDate(value)}</span>
        </div>
      </td>
    );
  }

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

const PLATFORM_LINKS = [
  {
    id: 'facebook',
    label: 'Facebook',
    keys: ['fbLink', 'facebookLink'],
    Icon: () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
    )
  },
  {
    id: 'instagram',
    label: 'Instagram',
    keys: ['igLink', 'instagramLink'],
    Icon: () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    )
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    keys: ['ttLink', 'tiktokLink'],
    Icon: () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
      </svg>
    )
  }
];

const normalizePlatformUrl = (url) => {
  const trimmedUrl = String(url || '').trim();
  if (!trimmedUrl) return '';
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

const getPlatformLink = (row, keys) => {
  const value = keys.map((key) => row?.[key]).find(Boolean);
  return normalizePlatformUrl(value);
};

const PlatformCell = ({ row }) => {
  const linkedPlatforms = PLATFORM_LINKS
    .map((platform) => ({
      ...platform,
      href: getPlatformLink(row, platform.keys)
    }))
    .filter((platform) => platform.href);

  return (
    <td className="px-6 py-4 border-r border-slate-100">
      {linkedPlatforms.length > 0 ? (
        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          {linkedPlatforms.map(({ id, label, href, Icon }) => (
            <a
              key={id}
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 rounded-xl text-[#003870] flex items-center justify-center transition-all hover:bg-[#003870] hover:text-white hover:scale-105"
              title={`Open ${label}`}
            >
              <Icon />
            </a>
          ))}
        </div>
      ) : (
        <span className="inline-flex h-8 items-center rounded-2xl bg-slate-50 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300">No Links</span>
      )}
    </td>
  );
};

const CalendarTable = ({
  data,
  onAiEdit,
  onDeleteRow,
  onUpdateRow,
  onViewRow,
  onOpenReference,
  onGenerateScript,
  getStatusColor,
  editingIndex,
  generatingScriptIndex = null,
  variant = 'generated',
  readOnly = false,
  hideActions = false
}) => {
  const isContentRowView = variant === 'contentRow';
  const showActions = !hideActions;
  const actionColumnClass = isContentRowView && showActions
    ? 'sticky right-0 z-50 bg-slate-50 shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.8)]'
    : '';
  const actionCellClass = isContentRowView && showActions
    ? 'sticky right-0 z-30 bg-white group-hover:bg-slate-50 shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.8)]'
    : '';
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

  const isReelRow = (row) => String(row.contentType || row.type || '').toLowerCase() === 'reel';

  return (
    <table className="w-full text-left text-sm border-collapse table-fixed">
      <thead className="bg-slate-50/80 sticky top-0 z-40 shadow-sm">
        <tr>
          <th className={`${isContentRowView ? 'w-[110px]' : 'w-[120px]'} px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100`}>Date</th>
          <th className={`${isContentRowView ? 'w-[130px]' : 'w-[140px]'} px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100`}>Type</th>
          {isContentRowView && (
            <th className="w-[135px] px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Platform</th>
          )}
          <th className={`${isContentRowView ? 'w-[165px]' : 'w-[180px]'} px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100`}>Pillar</th>
          <th className={`${isContentRowView ? 'w-[220px]' : 'w-[220px]'} px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100`}>Visual Copy</th>
          <th className={`${isContentRowView ? 'w-[380px]' : 'w-[400px]'} px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100`}>Caption</th>
          <th className={`${isContentRowView ? 'w-[115px]' : 'w-[140px]'} px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100`}>Status</th>
          {showActions && (
            <th className={`${isContentRowView ? 'w-[96px]' : 'w-[150px]'} px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100 text-center ${actionColumnClass}`}>Actions</th>
          )}
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
              onSave={(val) => onUpdateRow && onUpdateRow(i, { date: val })}
              className="px-6 py-4 border-r border-slate-100 whitespace-nowrap"
              readOnly={readOnly}
            />
            
            <DropdownCell 
              value={row.contentType}
              options={contentTypeOptions}
              onSave={(val) => onUpdateRow && onUpdateRow(i, { contentType: val })}
              className="px-6 py-4 border-r border-slate-100"
              readOnly={readOnly}
              renderDisplay={(val) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${editingIndex === i ? 'bg-white text-[#003870]' : 'bg-slate-100 text-slate-700'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {getContentTypeIcon(val)}
                  </span>
                  {val}
                </span>
              )}
            />

            {isContentRowView && <PlatformCell row={row} />}
            
            <EditableCell 
              value={row.pillar} 
              onSave={(val) => onUpdateRow && onUpdateRow(i, { pillar: val })}
              className="px-6 py-4 font-bold text-[#003870] border-r border-slate-100 whitespace-pre-wrap leading-tight break-words overflow-hidden [overflow-wrap:anywhere]"
              readOnly={readOnly}
            />
            
            <EditableCell 
              value={row.visualCopy || row.visual} 
              onSave={(val) => onUpdateRow && onUpdateRow(i, { visualCopy: val, visual: val })}
              className="px-6 py-4 text-slate-800 font-semibold border-r border-slate-100 whitespace-pre-wrap leading-relaxed break-words"
              readOnly={readOnly}
            />

            <EditableCell 
              value={row.caption} 
              onSave={(val) => onUpdateRow && onUpdateRow(i, { caption: val })}
              className="px-6 py-4 text-slate-50 font-medium border-r border-slate-100 whitespace-pre-wrap leading-relaxed break-words !text-slate-500"
              readOnly={readOnly}
            />

            <DropdownCell 
              value={row.status}
              options={statusOptions}
              onSave={(val) => onUpdateRow && onUpdateRow(i, { status: val })}
              className="px-6 py-4 border-r border-slate-100"
              readOnly={readOnly}
              renderDisplay={(val) => (
                <div className="flex flex-col items-start gap-1.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold border uppercase tracking-widest ${getStatusColor(val)}`}>
                    {val}
                  </span>
                  {isReelRow(row) && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenReference && onOpenReference(row, i);
                      }}
                      className="text-[11px] font-extrabold uppercase tracking-wider text-[#003870] underline underline-offset-2 hover:text-[#0055a5]"
                    >
                      Reference
                    </button>
                  )}
                </div>
              )}
            />

            {showActions && (
              <td className={`px-4 py-4 text-center ${actionCellClass}`}>
                <div className="flex items-center justify-center gap-2">
                  {isContentRowView ? (
                    <button
                      type="button"
                      onClick={() => onViewRow && onViewRow(i)}
                      className="p-2.5 rounded-xl bg-blue-50 text-[#003870] hover:bg-[#003870] hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95 group"
                      title="Edit Post"
                    >
                      <span className="material-symbols-outlined text-[20px] block">edit</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                      {isReelRow(row) && (
                        <button
                          type="button"
                          onClick={() => onGenerateScript && onGenerateScript(i)}
                          disabled={generatingScriptIndex === i}
                          className="h-9 w-9 rounded-xl text-slate-500 hover:bg-[#003870] hover:text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
                          title="Generate Reel Script"
                        >
                          <span className={`material-symbols-outlined text-[20px] block ${generatingScriptIndex === i ? 'animate-spin' : ''}`}>
                            {generatingScriptIndex === i ? 'progress_activity' : 'movie_creation'}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => onAiEdit && onAiEdit(i, e)}
                        className={`h-9 w-9 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                          editingIndex === i
                            ? 'bg-[#003870] text-white'
                            : 'text-[#003870] hover:bg-[#003870] hover:text-white'
                        }`}
                        title="Edit with AI"
                      >
                        <span className="material-symbols-outlined text-[20px] block">auto_awesome</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRow && onDeleteRow(i)}
                        className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-105 active:scale-95"
                        title="Delete Row"
                      >
                        <span className="material-symbols-outlined text-[20px] block">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CalendarTable;
