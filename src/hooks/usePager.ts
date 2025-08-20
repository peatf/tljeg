import { useState, useEffect } from 'react';

export function usePager(totalPages: number, storageKey: string = 'reader-position') {
  const [currentPage, setCurrentPage] = useState(0);

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const savedPage = parseInt(saved, 10);
      if (savedPage >= 0 && savedPage < totalPages) {
        setCurrentPage(savedPage);
      }
    }
  }, [totalPages, storageKey]);

  // Save position to localStorage whenever page changes
  useEffect(() => {
    localStorage.setItem(storageKey, currentPage.toString());
  }, [currentPage, storageKey]);

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    currentPage,
    totalPages,
    goNext,
    goPrev,
    goToPage,
    canGoNext: currentPage < totalPages - 1,
    canGoPrev: currentPage > 0
  };
}