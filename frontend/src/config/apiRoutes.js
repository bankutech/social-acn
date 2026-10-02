export const API_ROUTES = {
  // Auth
  AUTH_ME: '/api/auth/me',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_GOOGLE: '/api/auth/google',
  AUTH_LOGOUT: '/api/auth/logout',

  // Users & Profile
  PROFILE: '/api/auth/profile',
  PROFILE_ID: (userId) => `/api/auth/profile/${userId}`,
  FOLLOW_TOGGLE: (userId) => `/api/auth/follow/${userId}`,
  EXPLORE_USERS: '/api/auth/explore',
  SEARCH_USERS: '/api/auth/search',
  ONBOARDING: '/api/auth/onboarding',
  AVATAR_UPLOAD: '/api/auth/avatar',

  // Posts
  POSTS: '/api/posts',
  POST_ID: (postId) => `/api/posts/${postId}`,
  POST_LIKE: (postId) => `/api/posts/${postId}/like`,
  POST_COMMENTS: (postId) => `/api/posts/${postId}/comments`,
  POST_COMMENT_ID: (postId, commentId) => `/api/posts/${postId}/comments/${commentId}`,
  POST_COMMENT_LIKE: (postId, commentId) => `/api/posts/${postId}/comments/${commentId}/like`,

  // Groups
  GROUPS: '/api/groups',
  GROUP_ID: (groupId) => `/api/groups/${groupId}`,
  GROUP_JOIN: (groupId) => `/api/groups/${groupId}/join`,
  GROUP_POSTS: (groupId) => `/api/groups/${groupId}/posts`,

  // Chat
  CHAT: '/api/chat',
  CHAT_USERS: '/api/chat/users',
  CHAT_MESSAGES: (targetId) => `/api/chat/${targetId}`,
  PARTNER_CHAT: '/api/partner-chat',
  PARTNER_CHAT_TARGET: (targetId) => `/api/partner-chat/${targetId}`,
  ONLINE_USERS: '/api/online-users',

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATIONS_READ: (id) => `/api/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/api/notifications/read-all',

  // Bookmarks
  BOOKMARKS: '/api/bookmarks',
  BOOKMARKS_FOLDERS: '/api/bookmarks/folders',
  BOOKMARK_FOLDER: (folderId) => `/api/bookmarks/folders/${folderId}`,
  BOOKMARK_TOGGLE: (postId) => `/api/bookmarks/${postId}`,
  BOOKMARK_FOLDER_POST: (folderId, postId) => `/api/bookmarks/folders/${folderId}/posts/${postId}`,
};
