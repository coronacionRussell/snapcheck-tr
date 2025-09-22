
# SnapCheck Data Dictionary

This document outlines the data structure used in Firestore for the SnapCheck application.

## Collections

### `users`

This collection stores information about each registered user.

-   **Document ID:** `user.uid` (Firebase Authentication User ID)
-   **Structure:**
    -   `uid` (string): The unique ID of the user, matching the document ID.
    -   `fullName` (string): The user's full name.
    -   `email` (string): The user's email address.
    -   `role` (string): The user's role in the application. Can be `student`, `teacher`, or `admin`.
    -   `isVerified` (boolean): For teachers, this indicates whether their account has been verified by an admin. Defaults to `false` for new teachers.
    -   `verificationIdUrl` (string, optional): A URL pointing to the teacher's uploaded verification document in Firebase Storage.

---

### `classes`

This collection stores all the classes created by teachers.

-   **Document ID:** Auto-generated Firestore ID (this ID is used as the "Class Code").
-   **Structure:**
    -   `name` (string): The name of the class (e.g., "English 101").
    -   `teacherId` (string): The `uid` of the teacher who created the class.
    -   `teacherName` (string): The full name of the teacher.
    -   `studentCount` (number): The number of students enrolled in the class.
    -   `pendingSubmissions` (number): A count of submissions in this class with the status 'Pending Review'.

#### Sub-collection: `students`

This sub-collection within each `class` document lists all enrolled students.

-   **Collection Path:** `classes/{classId}/students`
-   **Document ID:** `student.uid` (The student's user ID)
-   **Structure:**
    -   `name` (string): The full name of the student.
    -   `joinedAt` (Timestamp): The date and time the student joined the class.

#### Sub-collection: `activities`

This sub-collection within each `class` document lists all activities or assignments.

-   **Collection Path:** `classes/{classId}/activities`
-   **Document ID:** Auto-generated Firestore ID
-   **Structure:**
    -   `name` (string): The name of the activity (e.g., "The Great Gatsby Essay").
    -   `description` (string): A brief description of the activity.
    -   `rubric` (string): The full text of the grading rubric for this activity.
    -   `createdAt` (Timestamp): The date and time the activity was created.

#### Sub-collection: `submissions`

This sub-collection within each `class` document stores all essay submissions from students.

-   **Collection Path:** `classes/{classId}/submissions`
-   **Document ID:** Auto-generated Firestore ID
-   **Structure:**
    -   `studentId` (string): The `uid` of the student who made the submission.
    -   `studentName` (string): The full name of the student.
    -   `activityId` (string): The ID of the `activity` this submission is for.
    -   `assignmentName` (string): The name of the activity at the time of submission.
    -   `essayText` (string): The full text of the student's essay.
    -   `essayImageUrl` (string, optional): A URL pointing to the original uploaded essay image in Firebase Storage.
    -   `submittedAt` (Timestamp): The date and time of the submission.
    -   `status` (string): The current status of the submission. Can be `Pending Review` or `Graded`.
    -   `grade` (string, optional): The final score or grade assigned by the teacher.
    -   `feedback` (string, optional): The final feedback provided by the teacher.


    