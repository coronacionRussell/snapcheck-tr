
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FilePenLine, LayoutDashboard, Settings, Star } from 'lucide-react';
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
      href: '/app/student/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard />,
    },
    {
      href: '/app/student/submit-essay',
      label: 'Submit Essay',
      icon: <FilePenLine />,
    },
    {
      href: '/app/student/grades',
      label: 'My Grades',
      icon: <Star />,
    },
    {
      href: '/app/student/settings',
      label: 'Settings',
      icon: <Settings />,
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
