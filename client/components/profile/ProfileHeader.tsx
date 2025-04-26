import { IUser } from '@/types/user';
import Image from 'next/image';
import { FaPhone, FaEnvelope } from 'react-icons/fa';

interface ProfileHeaderProps {
  user: IUser | null;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  if (!user) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div className="relative w-36 h-36 sm:w-44 sm:h-44">
          <Image
            src="/default-avatar.png"
            alt={`${user.first_name} ${user.last_name}`}
            fill
            className="rounded-full object-cover border-4 border-primary/20 shadow-md"
          />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{`${user.first_name} ${user.last_name}`}</h1>
            <div className="flex flex-col sm:flex-row gap-3 mt-2 text-gray-600 items-center sm:items-start">
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-primary" />
                <span>{user.email}</span>
              </div>
              {user.phone_number && (
                <div className="flex items-center gap-2">
                  <FaPhone className="text-primary" />
                  <span>{user.phone_number}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {user.user_roles.map((role, index) => (
              <span
                key={index}
                className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {role}
              </span>
            ))}
            <span className="px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              {user.isVerified ? 'Verified User' : 'Pending Verification'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}