--------------------------------
--  accounts
--------------------------------

CREATE TABLE "accounts" (
  "id" character(32) NOT NULL,
  "username" character varying(40) NOT NULL,
  "password" character varying(80) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX "accounts_username" ON "accounts" ("username");

--------------------------------
--  files
--------------------------------

CREATE TABLE "files" (
  "id" character(32) NOT NULL,
  "task_id" character(32) NOT NULL,
  "name" character varying(80) NOT NULL,
  "file_path" text NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX "files_task_id" ON "files" ("task_id");

--------------------------------
--  tasks
--------------------------------

CREATE TABLE "tasks" (
  "id" character(32) NOT NULL,
  "task_list_id" character(32) NOT NULL,
  "description" text NOT NULL,
  "due" timestamptz,
  "completed" timestamptz,
  PRIMARY KEY ("id")
);

CREATE INDEX "tasks_task_list_id" ON "tasks" ("task_list_id");
CREATE INDEX "tasks_completed" ON "tasks" ("completed");

--------------------------------
--  task lists
--------------------------------

CREATE TABLE "task_lists" (
  "id" character varying(32) NOT NULL,
  "account_id" character varying(32) NOT NULL,
  "name" character varying(80) NOT NULL,
  PRIMARY KEY ("id", "account_id")
);

CREATE INDEX "task_lists_account_id" ON "task_lists" ("account_id");





--------------------------------
-- Test database
--------------------------------

CREATE DATABASE test WITH TEMPLATE (SELECT current_database())