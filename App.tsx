import React from 'react';
import { Tab, TabContentState, ImageAnalysisResult } from './types'; // Import ImageAnalysisResult
import TabbedInterface from './components/TabbedInterface';

function App() {
  const [tabs, setTabs] = React.useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = React.useState<string>('');

  // Helper to generate unique IDs
  const generateUniqueId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add initial tab on first render
  React.useEffect(() => {
    if (tabs.length === 0) {
      addTab();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  const createNewTab = (name: string, id?: string): Tab => ({
    id: id || generateUniqueId(),
    name: name,
    contentState: {
      uploadedImage: null,
      selectedOptions: [],
      rawAnalysisResult: null, // Initialize rawAnalysisResult with null
      isLoading: false,
      error: null,
      otherAnalysisText: '', // 初始化 otherAnalysisText
    },
  });

  const addTab = React.useCallback(() => {
    const newTab = createNewTab(`頁籤 ${tabs.length + 1}`);
    setTabs((prevTabs) => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs.length]);

  const renameTab = React.useCallback((id: string, newName: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => (tab.id === id ? { ...tab, name: newName } : tab))
    );
  }, []);

  const deleteTab = React.useCallback((id: string) => {
    setTabs((prevTabs) => {
      const filteredTabs = prevTabs.filter((tab) => tab.id !== id);
      if (id === activeTabId && filteredTabs.length > 0) {
        // If active tab is deleted, switch to the first available tab
        setActiveTabId(filteredTabs[0].id);
      } else if (filteredTabs.length === 0) {
        // If no tabs left, add a new one
        addTab(); // Add a new tab when all are deleted
      } else if (id === activeTabId && filteredTabs.length === 0) {
        // This case handles when the last tab is deleted and addTab creates a new one,
        // so no need to setActiveTabId again for an empty array.
      }
      return filteredTabs;
    });
  }, [activeTabId, addTab]);

  const reorderTabs = React.useCallback((startIndex: number, endIndex: number) => {
    setTabs((prevTabs) => {
      const result = Array.from(prevTabs);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const onTabContentStateChange = React.useCallback(
    (tabId: string, newState: Partial<TabContentState>) => {
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === tabId
            ? { ...tab, contentState: { ...tab.contentState, ...newState } }
            : tab
        )
      );
    },
    []
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-50">
      <header className="p-4 bg-blue-700 text-white shadow-lg sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-center">AI 圖片分析器</h1>
      </header>
      <main className="flex-grow overflow-hidden">
        <TabbedInterface
          tabs={tabs}
          activeTabId={activeTabId}
          addTab={addTab}
          setActiveTab={setActiveTabId}
          renameTab={renameTab}
          deleteTab={deleteTab}
          reorderTabs={reorderTabs}
          onTabContentStateChange={onTabContentStateChange}
        />
      </main>
    </div>
  );
}

export default App;