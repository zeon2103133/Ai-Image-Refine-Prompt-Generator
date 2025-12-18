import React from 'react';
import { Tab, AnalysisOption, TabContentState } from '../types';
import DraggableTab from './DraggableTab';
import TabContent from './TabContent';

interface TabbedInterfaceProps {
  tabs: Tab[];
  activeTabId: string;
  addTab: () => void;
  setActiveTab: (id: string) => void;
  renameTab: (id: string, newName: string) => void;
  deleteTab: (id: string) => void;
  reorderTabs: (startIndex: number, endIndex: number) => void;
  onTabContentStateChange: (tabId: string, newState: Partial<TabContentState>) => void;
}

const TabbedInterface: React.FC<TabbedInterfaceProps> = ({
  tabs,
  activeTabId,
  addTab,
  setActiveTab,
  renameTab,
  deleteTab,
  reorderTabs,
  onTabContentStateChange,
}) => {
  const [draggingTabId, setDraggingTabId] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, id: string) => {
    setDraggingTabId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Allows drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetId: string) => {
    e.preventDefault();
    if (draggingTabId === null || draggingTabId === targetId) {
      setDraggingTabId(null);
      return;
    }

    const startIndex = tabs.findIndex((tab) => tab.id === draggingTabId);
    const endIndex = tabs.findIndex((tab) => tab.id === targetId);

    if (startIndex !== -1 && endIndex !== -1) {
      reorderTabs(startIndex, endIndex);
    }
    setDraggingTabId(null);
  };

  const currentTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <div className="flex flex-wrap items-end bg-gray-900 border-b border-gray-700 px-4 pt-4 sm:pt-0 sticky top-0 z-10" role="tablist">
        <div className="flex flex-wrap items-end overflow-x-auto custom-scrollbar flex-grow">
          {tabs.map((tab) => (
            <DraggableTab
              key={tab.id}
              tabId={tab.id}
              tabName={tab.name}
              isActive={tab.id === activeTabId}
              onClick={() => setActiveTab(tab.id)}
              onRename={renameTab} // Pass the renameTab function directly
              onDelete={deleteTab}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggingTabId === tab.id}
            />
          ))}
        </div>
        <button
          onClick={addTab}
          className="ml-2 mb-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200 shrink-0"
          title="新增頁籤"
          aria-label="新增頁籤"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {currentTab && (
          <TabContent
            key={currentTab.id} // Key ensures remount on tab change
            tabId={currentTab.id}
            contentState={currentTab.contentState}
            onContentStateChange={onTabContentStateChange}
          />
        )}
      </div>
    </div>
  );
};

export default TabbedInterface;