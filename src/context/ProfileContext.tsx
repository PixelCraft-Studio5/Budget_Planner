import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAccountStorageKey } from "../utils/accountStorage";
import { useAuth } from "./AuthContext";

interface Profile {
  name: string;
  email: string;
  currency: string;
  monthlyBudget: number;
  notifications: boolean;
  darkMode: boolean;
}

interface ProfileContextType {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  resetProfile: () => void;
}

interface ProfileProviderProps {
  children: ReactNode;
}

const defaultProfile: Profile = {
  name: "Keanu",
  email: "keanu@example.com",
  currency: "ZAR",
  monthlyBudget: 0,
  notifications: true,
  darkMode: false,
};

const STORAGE_KEY =
  "budget-planner-profile";

const ProfileContext =
  createContext<ProfileContextType | undefined>(
    undefined
  );

function loadProfile(
  storageKey: string,
  email: string,
  name: string
): Profile {
  let savedProfile = localStorage.getItem(storageKey);

  if (!savedProfile) {
    const legacyProfile = localStorage.getItem(STORAGE_KEY);

    if (legacyProfile) {
      try {
        const parsedProfile = JSON.parse(legacyProfile) as Partial<Profile>;

        if (parsedProfile.email?.toLowerCase() === email) {
          localStorage.setItem(storageKey, legacyProfile);
          localStorage.removeItem(STORAGE_KEY);
          savedProfile = legacyProfile;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  if (!savedProfile) {
    return { ...defaultProfile, name, email };
  }

  try {
    const parsedProfile = JSON.parse(savedProfile) as Partial<Profile>;

    return {
      ...defaultProfile,
      ...parsedProfile,
    };
  } catch (error) {
    console.error("Failed to load saved profile:", error);
    return { ...defaultProfile, name, email };
  }
}

export function ProfileProvider({
  children,
}: ProfileProviderProps) {
  const { user } = useAuth();

  if (!user) {
    throw new Error("ProfileProvider requires a signed-in user");
  }

  const storageKey = getAccountStorageKey(STORAGE_KEY, user.email);
  const [profile, setProfile] =
    useState<Profile>(() => loadProfile(storageKey, user.email, user.name));

  // Apply dark mode
  useEffect(() => {
    document.body.classList.toggle(
      "dark-mode",
      profile.darkMode
    );
  }, [profile.darkMode]);

  // Update profile and save immediately
  const updateProfile = (
    updates: Partial<Profile>
  ) => {
    setProfile((currentProfile) => {
      const updatedProfile = {
        ...currentProfile,
        ...updates,
      };

      localStorage.setItem(
        storageKey,
        JSON.stringify(updatedProfile)
      );

      return updatedProfile;
    });
  };

  // Reset profile
  const resetProfile = () => {
    setProfile({ ...defaultProfile, name: user.name, email: user.email });

    localStorage.removeItem(
      storageKey
    );

    document.body.classList.remove(
      "dark-mode"
    );
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        resetProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(
    ProfileContext
  );

  if (!context) {
    throw new Error(
      "useProfile must be used inside a ProfileProvider"
    );
  }

  return context;
}