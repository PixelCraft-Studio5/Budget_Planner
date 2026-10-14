import { useUserData } from "./UserDataContext";

export function useProfile() {
  const {
    profile,
    updateProfile,
    resetProfile,
    saveProfile,
    syncError,
  } = useUserData();

  return {
    profile,
    updateProfile,
    resetProfile,
    saveProfile,
    syncError,
  };
}
