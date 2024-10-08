"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Menu, WandSparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AvatarMenu from "./avatar-menu";

const LandingPageHeader = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        if (window.scrollY > lastScrollY) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar);
      window.addEventListener("resize", handleResize);
      handleResize();

      return () => {
        window.removeEventListener("scroll", controlNavbar);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [lastScrollY]);

  const menuItems = [
    { href: "#overview", label: "價值" },
    { href: "#recommendation-feature", label: "穿搭推薦" },
    { href: "#image-search-feature", label: "以服搜服" },
    { href: "#text-search-feature", label: "白話搜尋" },
    { href: "#testimonial", label: "用戶回饋" },
  ];

  return (
    <header className='z-50'>
      <motion.div
        className={cn(
          "z-50 fixed w-full top-0 left-0 font-semibold bg-gray-100 bg-opacity-50 flex p-4 py-2 gap-4 h-[7vh] items-center justify-between",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
        initial={false}
        animate={{ y: isVisible ? 0 : "-100%" }}
        transition={{ duration: 0.3 }}
      >
        <div className='flex gap-4'>
          <Link href='/'>
            <WandSparkles className='text-indigo-400' />
          </Link>
          <p className='text-lg'>
            會不會<span className='text-indigo-400'>穿搭</span>啊
          </p>
        </div>
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon'>
                <Menu className='h-6 w-6' />
              </Button>
            </SheetTrigger>
            <SheetContent className='w-[40vw] bg-gray-100/80'>
              <nav className='flex flex-col gap-4 mt-8'>
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className='text-lg font-medium cursor-pointer'
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <div className='flex gap-4 font-light'>
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </header>
  );
};

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user: userResponse },
      } = await supabase.auth.getUser();
      setUser(userResponse);
    })();
  }, []);
  const pathname = usePathname();
  if (pathname === "/") return <LandingPageHeader />;

  return (
    <header>
      <div className='font-semibold bg-gray-100 border-solid border-b-2 flex p-4 py-2 gap-4 h-[7vh] items-center justify-between shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]'>
        <div className='flex gap-4'>
          <Link href='/'>
            <WandSparkles className='text-indigo-400' />
          </Link>
          <p className='text-lg'>
            會不會<span className='text-indigo-400'>穿搭</span>啊
          </p>
        </div>

        {user && <AvatarMenu />}
      </div>
    </header>
  );
};

export default Header;
