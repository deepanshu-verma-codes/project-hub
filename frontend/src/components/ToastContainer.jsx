import React from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineX } from 'react-icons/hi';

const ToastContainer = () => {
  const { notifications, removeNotification } = useBoardStore();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col space-y-3">
      {notifications.map((n) => (
        <div 
          key={n.id}
          className={`
            min-w-[280px] max-w-sm p-4 rounded-xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 flex items-center justify-between
            ${n.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 
              n.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 
              'bg-white border-gray-100 text-gray-800'}
          `}
        >
          <div className="flex items-center">
            <div className="mr-3 text-xl">
              {n.type === 'error' ? <HiOutlineExclamationCircle className="text-red-500" /> : 
               n.type === 'success' ? <HiOutlineCheckCircle className="text-green-500" /> : 
               <HiOutlineInformationCircle className="text-blue-500" />}
            </div>
            <p className="text-sm font-bold tracking-tight">{n.message}</p>
          </div>
          <button 
            onClick={() => removeNotification(n.id)}
            className="ml-4 text-gray-400 hover:text-gray-600 p-1"
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
