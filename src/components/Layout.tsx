import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppDispatch } from '@/hooks/reduxHooks';
import { addDevice, setCurrentDevice } from '@/store/slices/devicesSlice';
import JSADBClient from '@/services/JSADBClient';
import { Device } from '@/types/Device';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export default function Layout({ children, currentPage }: LayoutProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const jsadbClient = new JSADBClient();
    jsadbClient.getDeviceList().then((fetchedDevices) => {
      console.log("All Devices: ", fetchedDevices);
      fetchedDevices.forEach((device) => {
        dispatch(addDevice(device));
      });

      if (fetchedDevices.length === 1) {
        dispatch(setCurrentDevice(fetchedDevices[0]));
      }

      const storedCurrentDevice = localStorage.getItem('currentDevice');
      if (storedCurrentDevice) {
        const currentDevice = JSON.parse(storedCurrentDevice) as Device;
        dispatch(setCurrentDevice(currentDevice));
      }
    });
  }, [dispatch]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar currentPage={currentPage} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header currentPage={currentPage} />
        <main className="flex items-start gap-4 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
