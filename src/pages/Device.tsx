import Layout from '@/components/Layout';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react";
import { PlusCircle, Trash } from "lucide-react"
import { databaseService } from '@/services/DatabaseService';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import ScreenMirror from '@/components/ScreenMirror';

export default function Device() {
  const devices = useAppSelector((state) => state.devices.devices);

  return (
    <Layout currentPage="Devices">
      <div className="w-full items-start gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {devices.map((device) => (
            <ScreenMirror key={device.id} device={device} wrapperClassName="2xl:min-w-[100px] 2xl:max-w-[300px]" />
          ))}
        </div>
      </div>
    </Layout>
  )
}
