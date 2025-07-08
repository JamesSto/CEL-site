import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'cel_user_id';

export function getUserIdentifier(): string {
  try {
    // Check if user ID already exists in localStorage
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      // Generate new UUID for first-time user
      userId = uuidv4();
      localStorage.setItem(USER_ID_KEY, userId);
      console.log('Generated new user ID:', userId);
    } else {
      console.log('Using existing user ID:', userId);
    }
    
    return userId;
  } catch (error) {
    console.error('localStorage error:', error);
    throw new Error('Failed to access localStorage for user identification');
  }
}