import React from 'react';

interface DraggableTabProps {
  tabId: string;
  tabName: string;
  isActive: boolean;
  onClick: () => void;
  onRename: (id: string, newName: string) => void; // Modified to pass newName
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLButtonElement>, id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (e: React.DragEvent<HTMLButtonElement>, id: string) => void;
  isDragging: boolean;
}

const DraggableTab: React.FC<DraggableTabProps> = ({
  tabId,
  tabName,
  isActive,
  onClick,
  onRename,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [newTabName, setNewTabName] = React.useState(tabName);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Sync newTabName with tabName prop if it changes externally
  React.useEffect(() => {
    setNewTabName(tabName);
  }, [tabName]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTabName(e.target.value);
  };

  const handleRenameSubmit = () => {
    if (newTabName.trim() && newTabName !== tabName) {
      onRename(tabId, newTabName.trim()); // Pass newName to parent
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setNewTabName(tabName); // Revert to original name
      setIsEditing(false);
    }
  };

  return (
    <button
      draggable="true"
      onDragStart={(e) => onDragStart(e, tabId)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, tabId)}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      className={`relative px-4 py-2 text-sm font-medium rounded-t-lg flex items-center group
                  ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                  ${isDragging ? 'opacity-50' : ''}
                  transition-colors duration-200 ease-in-out whitespace-nowrap overflow-hidden
      `}
      aria-selected={isActive}
      role="tab"
      id={`tab-${tabId}`}
      aria-controls={`panel-${tabId}`}
      tabIndex={isActive ? 0 : -1}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={newTabName}
          onChange={handleNameChange}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-b border-white text-white w-full focus:outline-none"
          aria-label={`編輯頁籤名稱 ${tabName}`}
        />
      ) : (
        <span className="max-w-[120px] overflow-hidden text-ellipsis mr-2">{tabName}</span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent activating tab when deleting
          onDelete(tabId);
        }}
        className={`ml-1 p-0.5 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    ${isActive ? 'opacity-100' : ''}`}
        aria-label={`刪除頁籤 ${tabName}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </button>
  );
};

export default DraggableTab;