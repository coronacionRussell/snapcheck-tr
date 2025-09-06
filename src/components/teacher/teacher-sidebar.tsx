
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookCopy, Home, Settings, ScanLine } from 'lucide-react';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import Logo from '@/components/logo';

export default function TeacherSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      href: '/teacher/dashboard',
      label: 'Dashboard',
      icon: <Home className="text-primary" />,
    },
    {
      href: '/teacher/classes',
      label: 'Classes',
      icon: <BookCopy className="text-primary" />,
    },
    {
      href: '/teacher/scan-essay',
      label: 'Scan Essay',
      icon: <ScanLine className="text-primary" />,
    },
    {
      href: '/teacher/settings',
      label: 'Settings',
      icon: <Settings className="text-primary" />,
    },
  ];

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
