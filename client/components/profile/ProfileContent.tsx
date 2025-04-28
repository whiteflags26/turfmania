'use client';

import { useState, useEffect, JSX } from 'react';
import {
  Tab,
  TabGroup,
  TabList,
  TabPanels,
  TabPanel,
} from '@headlessui/react';
import { IUser } from '@/types/user';
import { getCurrentUserProfile } from '@/lib/server-apis/profile/getCurrentUserProfile-api';
import { toast } from 'react-hot-toast';

import ProfileHeader from '@/components/profile/ProfileHeader';
import UpdateProfileForm from '@/components/profile/UpdateProfileForm';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import ReviewsSection from '@/components/profile/ReviewsSection';
import OrganizationRequestsSection from '@/components/profile/OrganizationRequestsSection';

import {
  UserIcon,
  LockClosedIcon,
  StarIcon,
  BuildingOfficeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface ProfileContentProps {
  readonly initialUser: IUser;
}

function ProfileTab({
  user,
  setUser,
}: {
  readonly user: IUser;
  readonly setUser: (user: IUser) => void;
}): JSX.Element {
  return <UpdateProfileForm user={user} setUser={setUser} />;
}

function PasswordTab(): JSX.Element {
  return <ChangePasswordForm />;
}

function ReviewsTab(): JSX.Element {
  return <ReviewsSection />;
}

function OrganizationsTab(): JSX.Element {
  return <OrganizationRequestsSection />;
}

export default function ProfileContent({
  initialUser,
}: ProfileContentProps) {
  const [user, setUser] = useState<IUser>(initialUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      setLoading(true);
      try {
        const userData = await getCurrentUserProfile();
        setUser(userData);
      } catch (err) {
        const e = err as Error;
        setError(e.message);
        toast.error('Failed to load complete profile data');
      } finally {
        setLoading(false);
      }
    }
    fetchUserProfile();
  }, [initialUser]);

  const tabs = [
    {
      name: 'Profile',
      icon: UserIcon,
      component: <ProfileTab user={user} setUser={setUser} />,
    },
    {
      name: 'Password',
      icon: LockClosedIcon,
      component: <PasswordTab />,
    },
    {
      name: 'Reviews',
      icon: StarIcon,
      component: <ReviewsTab />,
    },
    {
      name: 'Organizations',
      icon: BuildingOfficeIcon,
      component: <OrganizationsTab />,
    },
  ] as const;

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <PencilSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-semibold text-gray-900">
          Error loading profile
        </h3>
        <p className="mt-1 text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          type="button"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <ProfileHeader user={user} />

      <div className="bg-white rounded-xl shadow-lg p-1 sm:p-2">
        <TabGroup>
          <TabList className="flex space-x-1 rounded-xl bg-gray-100 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'flex items-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-primary focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-primary shadow'
                      : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
                  )
                }
                type="button"
              >
                <tab.icon className="h-5 w-5 mx-auto sm:mx-0" />
                <span className="hidden sm:inline">{tab.name}</span>
              </Tab>
            ))}
          </TabList>

          <TabPanels className="mt-2 p-4">
            {tabs.map((tab) => (
              <TabPanel
                key={tab.name}
                className={classNames('rounded-xl focus:outline-none')}
              >
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-64 bg-gray-100 rounded-xl"></div>
                  </div>
                ) : (
                  tab.component
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </>
  );
}
