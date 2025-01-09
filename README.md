# File-Uploader

A basic personal cloud-storage platform built with Node.js, Express.js, Passport.js, PostgreSQL with Prisma, and EJS.

Users can create folders, upload files, share files and folders, and navigate the folder structures.

Breadcrumbs always show the current folder/file and allow for quick backtracking.

Sharing a folder/file generates a public link that users can share with anyone, when the specified duration passes or the user has stopped sharing the link will no longer be accessible.

Anyone visiting the public link will have a restricted view of the shared resource and is only allowed to download any files within it.
