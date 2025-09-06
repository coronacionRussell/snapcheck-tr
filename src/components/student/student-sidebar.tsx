
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FilePenLine, LayoutDashboard, Settings, History, BookCopy } from 'lucide-react';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import Logo from '@/components/logo';

export default function StudentSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      href: '/student/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="text-primary" />,
    },
     {
      href: '/student/classes',
      label: 'My Classes',
      icon: <BookCopy className="text-primary" />,
    },
    {
      href: '/student/submit-essay',
      label: 'Submit Essay',
      icon: <FilePenLine className="text-primary" />,
    },
    {
      href: '/student/grades',
      label: 'Submission History',
      icon: <History className="text-primary" />,
    },
    {
      href: '/student/settings',
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
