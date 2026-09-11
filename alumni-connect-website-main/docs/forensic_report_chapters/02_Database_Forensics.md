# CHAPTER 5 — DATABASE DESIGN (FORENSIC AUDIT)

## 5.1 Models Overview
The system implements 23 distinct Mongoose models. Below is the forensic audit of each model based on the exact source code in `backend/models/`.

### 5.1.1 Model: Business
- **Source File**: `backend/models/Business.js`
- **Key Fields**:
  - `name` (String)
  - `founder` (mongoose.Schema.Types.ObjectId)
  - `industry` (String)
  - `location` (String)
  - `stage` (String)
  - `description` (String)
  - `logo` (String)
  - `website` (String)
  - `hiring` (Boolean)
  - `views` (Number)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `Business`

### 5.1.2 Model: ChatGroup
- **Source File**: `backend/models/ChatGroup.js`
- **Key Fields**:
  - `name` (String)
  - `description` (String)
  - `avatar` (String)
  - `admin` (mongoose.Schema.Types.ObjectId)
  - `isActive` (Boolean)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `ChatGroup`

### 5.1.3 Model: Contest
- **Source File**: `backend/models/Contest.js`
- **Key Fields**:
  - `title` (String)
  - `description` (String)
  - `organizer` (mongoose.Schema.Types.ObjectId)
  - `contestType` (String)
  - `startDate` (Date)
  - `endDate` (Date)
  - `duration` (Number)
  - `title` (String)
  - `description` (String)
  - `difficulty` (String)
  - `points` (Number)
  - `timeLimit` (Number)
  - `memoryLimit` (Number)
  - `input` (String)
  - `expectedOutput` (String)
  - `isHidden` (Boolean)
  - `scoringSystem` (String)
  - `penalty` (Number)
  - `isRegistrationRequired` (Boolean)
  - `maxParticipants` (Number)
  - `currentParticipants` (Number)
  - `registrationDeadline` (Date)
  - `status` (String)
  - `user` (mongoose.Schema.Types.ObjectId)
  - `registeredAt` (Date)
  - `totalScore` (Number)
  - `totalTime` (Number)
  - `problem` (mongoose.Schema.Types.ObjectId)
  - `language` (String)
  - `code` (String)
  - `submittedAt` (Date)
  - `status` (String)
  - `user` (mongoose.Schema.Types.ObjectId)
  - `isPublic` (Boolean)
  - `allowPractice` (Boolean)
  - `showLeaderboard` (Boolean)
  - `totalSubmissions` (Number)
  - `totalAccepted` (Number)
  - `category` (String)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).
- **Mongoose Collection Name**: `Contest`

### 5.1.4 Model: DevProfile
- **Source File**: `backend/models/DevProfile.js`
- **Key Fields**:
  - `user` (mongoose.Schema.Types.ObjectId)
  - `email` (String)
  - `usernames` (String)
  - `isVerified` (Boolean)
  - `leetcode` (String)
  - `isVerified` (Boolean)
  - `hackerrank` (String)
  - `isVerified` (Boolean)
  - `gfg` (String)
  - `isVerified` (Boolean)
  - `codechef` (String)
  - `isVerified` (Boolean)
  - `codeforces` (String)
  - `isVerified` (Boolean)
  - `duolingo` (String)
  - `isVerified` (Boolean)
  - `stats` (mongoose.Schema.Types.Mixed)
  - `leetcode` (mongoose.Schema.Types.Mixed)
  - `hackerrank` (mongoose.Schema.Types.Mixed)
  - `gfg` (mongoose.Schema.Types.Mixed)
  - `codechef` (mongoose.Schema.Types.Mixed)
  - `codeforces` (mongoose.Schema.Types.Mixed)
  - `duolingo` (mongoose.Schema.Types.Mixed)
  - `lastUpdated` (Date)
  - `alumnexScore` (Number)
  - `verificationCode` (String)
  - `verificationExpires` (Date)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `DevProfile`

### 5.1.5 Model: Event
- **Source File**: `backend/models/Event.js`
- **Key Fields**:
  - `title` (String)
  - `description` (String)
  - `eventType` (String)
  - `startDate` (Date)
  - `endDate` (Date)
  - `timezone` (String)
  - `location` (String)
  - `isVirtual` (Boolean)
  - `virtualPlatform` (String)
  - `organizer` (mongoose.Schema.Types.ObjectId)
  - `maxCapacity` (Number)
  - `currentRegistrations` (Number)
  - `isRegistrationRequired` (Boolean)
  - `registrationDeadline` (Date)
  - `category` (String)
  - `status` (String)
  - `isFree` (Boolean)
  - `price` (Number)
  - `currency` (String)
  - `views` (Number)
  - `user` (mongoose.Schema.Types.ObjectId)
  - `registeredAt` (Date)
  - `status` (String)
  - `isVerified` (Boolean)
  - `verifiedBy` (mongoose.Schema.Types.ObjectId)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).
- **Mongoose Collection Name**: `Event`

### 5.1.6 Model: Feedback
- **Source File**: `backend/models/Feedback.js`
- **Key Fields**:
  - `user` (mongoose.Schema.Types.ObjectId)
  - `category` (String)
  - `rating` (Number)
  - `subject` (String)
  - `message` (String)
  - `status` (String)
  - `adminReply` (String)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `Feedback`

### 5.1.7 Model: ForumPost
- **Source File**: `backend/models/ForumPost.js`
- **Key Fields**:
  - `title` (String)
  - `content` (String)
  - `author` (mongoose.Schema.Types.ObjectId)
  - `postType` (String)
  - `category` (String)
  - `status` (String)
  - `isFlagged` (Boolean)
  - `views` (Number)
  - `author` (mongoose.Schema.Types.ObjectId)
  - `content` (String)
  - `isEdited` (Boolean)
  - `isSolution` (Boolean)
  - `parentComment` (mongoose.Schema.Types.ObjectId)
  - `author` (mongoose.Schema.Types.ObjectId)
  - `content` (String)
  - `createdAt` (Date)
  - `createdAt` (Date)
  - `updatedAt` (Date)
  - `isModerated` (Boolean)
  - `reportCount` (Number)
  - `moderatedBy` (mongoose.Schema.Types.ObjectId)
  - `isFeatured` (Boolean)
  - `featuredBy` (mongoose.Schema.Types.ObjectId)
  - `poll` (mongoose.Schema.Types.ObjectId)
  - `votedAt` (Date)
  - `isActive` (Boolean)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).
- **Mongoose Collection Name**: `ForumPost`

### 5.1.8 Model: HelpDesk
- **Source File**: `backend/models/HelpDesk.js`
- **Key Fields**:
  - `user` (mongoose.Schema.Types.ObjectId)
  - `name` (String)
  - `email` (String)
  - `subject` (String)
  - `message` (String)
  - `status` (String)
  - `adminReply` (String)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `HelpDesk`

### 5.1.9 Model: Job
- **Source File**: `backend/models/Job.js`
- **Key Fields**:
  - `title` (String)
  - `description` (String)
  - `company` (String)
  - `jobType` (String)
  - `category` (String)
  - `location` (String)
  - `isRemote` (Boolean)
  - `remoteType` (String)
  - `experience` (Number)
  - `max` (Number)
  - `education` (String)
  - `salary` (Number)
  - `max` (Number)
  - `currency` (String)
  - `period` (String)
  - `applicationDeadline` (Date)
  - `applicationLink` (String)
  - `applicationMethod` (String)
  - `postedBy` (mongoose.Schema.Types.ObjectId)
  - `status` (String)
  - `views` (Number)
  - `applications` (Number)
  - `isVerified` (Boolean)
  - `verifiedBy` (mongoose.Schema.Types.ObjectId)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).
- **Mongoose Collection Name**: `Job`

### 5.1.10 Model: JobApplication
- **Source File**: `backend/models/JobApplication.js`
- **Key Fields**:
  - `job` (mongoose.Schema.Types.ObjectId)
  - `applicant` (mongoose.Schema.Types.ObjectId)
  - `status` (String)
  - `coverLetter` (String)
  - `resumeLink` (String)
  - `notes` (String)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `JobApplication`

### 5.1.11 Model: JobOpportunity
- **Source File**: `backend/models/JobOpportunity.js`
- **Key Fields**:
  - `postedBy` (mongoose.Schema.Types.ObjectId)
  - `title` (String)
  - `type` ({)
  - `company` (String)
  - `location` (String)
  - `description` (String)
  - `applicationLink` (String)
  - `deadline` (Date)
  - `status` (String)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `JobOpportunity`

### 5.1.12 Model: MentorReview
- **Source File**: `backend/models/MentorReview.js`
- **Key Fields**:
  - `mentorId` (mongoose.Schema.Types.ObjectId)
  - `studentId` (mongoose.Schema.Types.ObjectId)
  - `rating` (Number)
  - `feedback` (String)
  - `categories` (Number)
  - `guidance` (Number)
  - `availability` (Number)
  - `technicalKnowledge` (Number)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `MentorReview`

### 5.1.13 Model: MentorReward
- **Source File**: `backend/models/MentorReward.js`
- **Key Fields**:
  - `mentor` (mongoose.Schema.Types.ObjectId)
  - `college` (String)
  - `totalPoints` (Number)
  - `breakdown` (Number)
  - `completedMentorships` (Number)
  - `feedbackPoints` (Number)
  - `sessionPoints` (Number)
  - `totalFeedbacks` (Number)
  - `averageRating` (Number)
  - `lastUpdated` (Date)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).
- **Mongoose Collection Name**: `MentorReward`

### 5.1.14 Model: Mentorship
- **Source File**: `backend/models/Mentorship.js`
- **Key Fields**:
  - `student` (mongoose.Schema.Types.ObjectId)
  - `mentor` (mongoose.Schema.Types.ObjectId)
  - `status` (String)
  - `title` (String)
  - `description` (String)
  - `startDate` (Date)
  - `expectedDuration` (Number)
  - `endDate` (Date)
  - `meetingSchedule` (String)
  - `preferredTime` (String)
  - `timezone` (String)
  - `progress` (String)
  - `completed` (Boolean)
  - `author` (mongoose.Schema.Types.ObjectId)
  - `timestamp` (Date)
  - `feedback` (Number)
  - `mentorRating` (Number)
  - `status` (String)
  - `updatedBy` (mongoose.Schema.Types.ObjectId)
  - `timestamp` (Date)
  - `cancelledBy` (mongoose.Schema.Types.ObjectId)
  - `isAutoAssigned` (Boolean)
  - `feedbackGiven` (Boolean)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).
- **Mongoose Collection Name**: `Mentorship`

### 5.1.15 Model: MentorshipRequest
- **Source File**: `backend/models/MentorshipRequest.js`
- **Key Fields**:
  - `student` (mongoose.Schema.Types.ObjectId)
  - `mentor` (mongoose.Schema.Types.ObjectId)
  - `domain` (String)
  - `message` (String)
  - `status` (String)
  - `rejectionReason` (String)
  - `startDate` (Date)
  - `endDate` (Date)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `MentorshipRequest`

### 5.1.16 Model: MentorshipSession
- **Source File**: `backend/models/MentorshipSession.js`
- **Key Fields**:
  - `mentor` (mongoose.Schema.Types.ObjectId)
  - `student` (mongoose.Schema.Types.ObjectId)
  - `date` (Date)
  - `time` (String)
  - `status` (String)
  - `createdAt` (Date)
- **Mongoose Collection Name**: `MentorshipSession`

### 5.1.17 Model: Message
- **Source File**: `backend/models/Message.js`
- **Key Fields**:
  - `sender` (mongoose.Schema.Types.ObjectId)
  - `receiver` (mongoose.Schema.Types.ObjectId)
  - `groupId` (mongoose.Schema.Types.ObjectId)
  - `isGlobal` (Boolean)
  - `content` (String)
  - `messageType` (String)
  - `status` (String)
  - `isFlagged` (Boolean)
  - `user` (mongoose.Schema.Types.ObjectId)
  - `readAt` (Date)
  - `replyTo` (mongoose.Schema.Types.ObjectId)
  - `forwardedFrom` (mongoose.Schema.Types.ObjectId)
  - `conversationId` (String)
  - `metadata` (Boolean)
  - `isDeleted` (Boolean)
  - `deletedBy` (mongoose.Schema.Types.ObjectId)
  - `user` (mongoose.Schema.Types.ObjectId)
  - `emoji` (String)
  - `createdAt` (Date)
  - `priority` (String)
  - `isScheduled` (Boolean)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).
- **Mongoose Collection Name**: `Message`

### 5.1.18 Model: Notification
- **Source File**: `backend/models/Notification.js`
- **Key Fields**:
  - `recipient` (mongoose.Schema.Types.ObjectId)
  - `sender` (mongoose.Schema.Types.ObjectId)
  - `type` ({)
  - `title` (String)
  - `content` (String)
  - `relatedData` (mongoose.Schema.Types.ObjectId)
  - `jobId` (mongoose.Schema.Types.ObjectId)
  - `eventId` (mongoose.Schema.Types.ObjectId)
  - `forumPostId` (mongoose.Schema.Types.ObjectId)
  - `contestId` (mongoose.Schema.Types.ObjectId)
  - `messageId` (mongoose.Schema.Types.ObjectId)
  - `connectionUserId` (mongoose.Schema.Types.ObjectId)
  - `priority` (String)
  - `isRead` (Boolean)
  - `requiresAction` (Boolean)
  - `actionType` (String)
  - `deliveryStatus` (String)
  - `emailSent` (Boolean)
  - `pushSent` (Boolean)
  - `isExpired` (Boolean)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).
- **Mongoose Collection Name**: `Notification`

### 5.1.19 Model: Project
- **Source File**: `backend/models/Project.js`
- **Key Fields**:
  - `title` (String)
  - `description` (String)
  - `user` (mongoose.Schema.ObjectId)
  - `tags` ([String])
  - `githubLink` (String)
  - `liveLink` (String)
  - `thumbnail` (String)
  - `views` (Number)
  - `featured` (Boolean)
  - `seekingMentorship` (Boolean)
  - `seekingTeamMembers` (Boolean)
  - `mentor` (mongoose.Schema.ObjectId)
  - `status` (String)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `Project`

### 5.1.20 Model: Report
- **Source File**: `backend/models/Report.js`
- **Key Fields**:
  - `reporter` (mongoose.Schema.Types.ObjectId)
  - `reportedUser` (mongoose.Schema.Types.ObjectId)
  - `reason` (String)
  - `details` (String)
  - `status` (String)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `Report`

### 5.1.21 Model: Task
- **Source File**: `backend/models/Task.js`
- **Key Fields**:
  - `title` (String)
  - `description` (String)
  - `actionText` (String)
  - `actionUrl` (String)
  - `targetAudience` (String)
  - `taskType` (String)
  - `isActive` (Boolean)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `Task`

### 5.1.22 Model: TechHub
- **Source File**: `backend/models/TechHub.js`
- **Key Fields**:
  - `author` (mongoose.Schema.Types.ObjectId)
  - `title` (String)
  - `description` (String)
  - `status` (String)
  - `views` (Number)
  - `questionId` (mongoose.Schema.Types.ObjectId)
  - `author` (mongoose.Schema.Types.ObjectId)
  - `content` (String)
  - `isAccepted` (Boolean)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Mongoose Collection Name**: `TechAssistanceQuestion`

### 5.1.23 Model: User
- **Source File**: `backend/models/User.js`
- **Key Fields**:
  - `name` (String)
  - `email` (String)
  - `phoneNumber` (String)
  - `phoneVerified` (Boolean)
  - `smsNotifications` (Boolean)
  - `password` (String)
  - `role` (String)
  - `photo` (String)
  - `bio` (String)
  - `location` (String)
  - `country` (String)
  - `college` (String)
  - `department` (String)
  - `studentInfo` (String)
  - `year` (Number)
  - `university` (String)
  - `alumniInfo` (Number)
  - `company` (String)
  - `position` (String)
  - `industry` (String)
  - `experience` (Number)
  - `studentsPlaced` (Number)
  - `employmentProofUrl` (String)
  - `adminVerifiedMentor` (Boolean)
  - `availableForMentorship` (Boolean)
  - `maxMentees` (Number)
  - `mentorRating` (Number)
  - `mentorReviewCount` (Number)
  - `mentorshipHours` (Number)
  - `collegeInfo` (Number)
  - `accreditation` (String)
  - `officialUrl` (String)
  - `rewardPoints` (Number)
  - `emailPreferences` (Boolean)
  - `devPulse` (Boolean)
  - `status` (String)
  - `isVerified` (Boolean)
  - `isApproved` (Boolean)
  - `isActive` (Boolean)
  - `lastActive` (Date)
- **Options**: Includes automated `createdAt` and `updatedAt` timestamps.
- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).
- **Mongoose Collection Name**: `ForumPost`

