import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'c_academy.db');
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS course_days (
    id TEXT PRIMARY KEY,
    day_number INTEGER UNIQUE NOT NULL CHECK(day_number BETWEEN 1 AND 30),
    title TEXT NOT NULL,
    description TEXT,
    published INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    day_id TEXT NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS solved_questions (
    id TEXT PRIMARY KEY,
    day_id TEXT NOT NULL,
    question TEXT NOT NULL,
    explanation TEXT,
    solution_code TEXT NOT NULL,
    expected_output TEXT,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS homework_questions (
    id TEXT PRIMARY KEY,
    day_id TEXT NOT NULL,
    question TEXT NOT NULL,
    starter_code TEXT,
    difficulty TEXT DEFAULT 'Easy' CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lesson_progress (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    day_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    UNIQUE(student_id, day_id),
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS practice_progress (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    day_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    UNIQUE(student_id, day_id),
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS homework_submissions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    homework_question_id TEXT NOT NULL,
    code TEXT NOT NULL,
    output TEXT,
    compilation_status TEXT NOT NULL CHECK(compilation_status IN ('success', 'error')),
    submitted_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Submitted',
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(homework_question_id) REFERENCES homework_questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS homework_grades (
    id TEXT PRIMARY KEY,
    submission_id TEXT UNIQUE NOT NULL,
    teacher_id TEXT NOT NULL,
    stars INTEGER NOT NULL CHECK(stars BETWEEN 0 AND 5),
    feedback TEXT,
    graded_at TEXT NOT NULL,
    FOREIGN KEY(submission_id) REFERENCES homework_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`);

console.log('Tables initialized.');

const CURRICULUM_DAYS = [
  { day: 1, title: 'Introduction to C Programming', desc: 'History, features, compilation process, and structure of a C program.' },
  { day: 2, title: 'Variables and Data Types', desc: 'Primitive data types, variable declaration, initialization, and memory sizes.' },
  { day: 3, title: 'Constants, Keywords and Identifiers', desc: 'Tokens in C, rules for naming identifiers, const qualifier, and literal types.' },
  { day: 4, title: 'Operators and Expressions', desc: 'Arithmetic, relational, logical, assignment, increment/decrement, and bitwise operators.' },
  { day: 5, title: 'Input and Output in C', desc: 'Formatted I/O with printf() and scanf(), format specifiers, and escape sequences.' },
  { day: 6, title: 'Conditional Statements: if, if-else', desc: 'Decision making, if statements, if-else branches, and Boolean conditions.' },
  { day: 7, title: 'Nested if and else-if Ladder', desc: 'Multi-way branching, cascading conditions, and nested logic flows.' },
  { day: 8, title: 'switch-case Statement', desc: 'Selection control structures, case labels, default fallback, and break behavior.' },
  { day: 9, title: 'while Loop', desc: 'Pre-tested iteration, loop conditions, iteration counters, and infinite loops.' },
  { day: 10, title: 'do-while Loop', desc: 'Post-tested iteration, guaranteed first run, and menu-driven program patterns.' },
  { day: 11, title: 'for Loop', desc: 'Counter-controlled iteration, multi-variable loops, and compact looping constructs.' },
  { day: 12, title: 'Nested Loops and Pattern Programs', desc: 'Star patterns, numeric pyramids, and matrix index traversal logic.' },
  { day: 13, title: 'break, continue and goto', desc: 'Jump statements, loop interruption, skipping iterations, and label jumps.' },
  { day: 14, title: 'Functions: Introduction and Basics', desc: 'Modular programming, function declaration, prototype, definition, and calling.' },
  { day: 15, title: 'Function Arguments and Return Values', desc: 'Pass by value, return types, multiple parameters, and pure functions.' },
  { day: 16, title: 'Recursion', desc: 'Base case vs recursive step, call stack frames, factorial, and Fibonacci examples.' },
  { day: 17, title: 'Arrays: One-Dimensional Arrays', desc: 'Contiguous memory allocation, index-based access, array traversal, and linear search.' },
  { day: 18, title: 'Two-Dimensional Arrays', desc: 'Row-major order, matrices, matrix addition, multiplication, and transposition.' },
  { day: 19, title: 'Strings and Character Arrays', desc: 'Null terminator (\\0), string literals, puts(), gets(), and fgets() security.' },
  { day: 20, title: 'String Handling Functions', desc: 'Standard string library: strlen, strcpy, strcat, strcmp, and manual implementations.' },
  { day: 21, title: 'Pointers: Introduction', desc: 'Memory addresses, address-of operator (&), dereference operator (*), and pointer variables.' },
  { day: 22, title: 'Pointers and Arrays', desc: 'Pointer arithmetic, array decay, accessing elements using pointer offset notation.' },
  { day: 23, title: 'Pointers and Functions', desc: 'Call by reference, swapping variables, pointer return types, and function pointers.' },
  { day: 24, title: 'Structures', desc: 'User-defined composite types, struct declaration, member access operator (.), and arrays of structs.' },
  { day: 25, title: 'Unions and Enumerations', desc: 'Shared memory allocation in unions vs structs, enum definitions, and type safety.' },
  { day: 26, title: 'Storage Classes', desc: 'Scope, lifetime, visibility: auto, register, static, and extern specifiers.' },
  { day: 27, title: 'Dynamic Memory Allocation', desc: 'Heap memory management using malloc(), calloc(), realloc(), and free() without memory leaks.' },
  { day: 28, title: 'File Handling', desc: 'File pointers, fopen modes, fgetc/fputc, fprintf/fscanf, fread/fwrite, and fclose.' },
  { day: 29, title: 'Preprocessor Directives and Header Files', desc: '#include, #define macros, conditional compilation (#ifdef, #ifndef), and custom header files.' },
  { day: 30, title: 'C Programming Revision + Mini Project', desc: 'Comprehensive review, building a Student Management System console application in C.' }
];

// Check existing users
const userCountRow = db.prepare('SELECT count(*) as count FROM users').get();
if (!userCountRow || userCountRow.count === 0) {
  console.log('Seeding initial data...');
  const teacherPass = bcrypt.hashSync('teacher123', 10);
  const studentPass = bcrypt.hashSync('student123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('usr-teacher-1', 'Prof. Alan Mitchell', 'teacher@academy.c', teacherPass, 'teacher', new Date().toISOString());
  insertUser.run('usr-student-1', 'Alex Johnson', 'student@academy.c', studentPass, 'student', new Date().toISOString());

  const insertDay = db.prepare(`
    INSERT INTO course_days (id, day_number, title, description, published)
    VALUES (?, ?, ?, ?, ?)
  `);

  CURRICULUM_DAYS.forEach((c) => {
    const isPublished = c.day <= 2 ? 1 : 0;
    insertDay.run(`day-${c.day}`, c.day, c.title, c.desc, isPublished);
  });

  const insertResource = db.prepare(`
    INSERT INTO resources (id, day_id, title, file_url, resource_type, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertResource.run('res-1-1', 'day-1', 'C Introduction Notes.pdf', '/resources/day1_c_introduction_notes.pdf', 'pdf', new Date().toISOString());
  insertResource.run('res-1-2', 'day-1', 'Day 1 Presentation.pptx', '/resources/day1_presentation.pptx', 'ppt', new Date().toISOString());
  insertResource.run('res-1-3', 'day-1', 'GCC Compiler Setup & Hello World Guide.pdf', '/resources/gcc_setup_guide.pdf', 'pdf', new Date().toISOString());
  insertResource.run('res-2-1', 'day-2', 'Variables, Data Types & Memory Layout.pdf', '/resources/day2_variables_notes.pdf', 'pdf', new Date().toISOString());

  const insertSolved = db.prepare(`
    INSERT INTO solved_questions (id, day_id, question, explanation, solution_code, expected_output, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertSolved.run(
    'sq-1-1',
    'day-1',
    'What is C programming and why is it called a middle-level language?',
    'C is a general-purpose, procedural computer programming language developed in 1972 by Dennis Ritchie at Bell Laboratories. It is often called a middle-level language because it combines the simplicity and features of high-level languages with the speed, low-level memory manipulation, and hardware access capabilities of low-level assembly languages.',
    `#include <stdio.h>

int main() {
    printf("C is a powerful middle-level language!\\n");
    printf("It provides direct memory access while maintaining high-level readability.\\n");
    return 0;
}`,
    'C is a powerful middle-level language!\nIt provides direct memory access while maintaining high-level readability.',
    1
  );

  insertSolved.run(
    'sq-1-2',
    'day-1',
    'What are the main features of C programming language?',
    'Key features of C include: (1) Simplicity & efficiency, (2) Portability / Machine Independence, (3) Mid-Level Capabilities (pointers, direct address access), (4) Rich Library of standard functions, (5) Structured Programming paradigm, and (6) Fast execution speed.',
    `#include <stdio.h>

int main() {
    printf("Core Features of C:\\n");
    printf("1. Structured Programming\\n");
    printf("2. Fast Execution\\n");
    printf("3. Pointer & Memory Control\\n");
    printf("4. Portability across architectures\\n");
    return 0;
}`,
    'Core Features of C:\n1. Structured Programming\n2. Fast Execution\n3. Pointer & Memory Control\n4. Portability across architectures',
    2
  );

  insertSolved.run(
    'sq-1-3',
    'day-1',
    'Write a simple C program to print "Hello World".',
    'This is the classic introductory program in C. It includes the standard input/output header (<stdio.h>), defines the entry point function main(), uses printf() to print to stdout, and returns 0 indicating successful execution.',
    `#include <stdio.h>

int main() {
    // printf sends formatted text to standard output
    printf("Hello World\\n");
    return 0;
}`,
    'Hello World',
    3
  );

  insertSolved.run(
    'sq-1-4',
    'day-1',
    'What is the basic structure of a C program?',
    'A typical C program consists of six main sections: (1) Documentation Section (comments), (2) Preprocessor Section (#include directives), (3) Definition Section (#define constants), (4) Global Declaration Section, (5) main() function (executable statements), and (6) Subprogram / User-defined functions section.',
    `#include <stdio.h> // Preprocessor directive

#define GREETING "Welcome to C Learning!" // Definition section

void showMessage(); // Global function declaration

int main() { // Main function entry
    printf("%s\\n", GREETING);
    showMessage();
    return 0;
}

void showMessage() { // Subprogram section
    printf("Code structured into modular sections!\\n");
}`,
    'Welcome to C Learning!\nCode structured into modular sections!',
    4
  );

  insertSolved.run(
    'sq-1-5',
    'day-1',
    'What is the purpose of the main() function in C?',
    'The main() function is the mandatory entry point of every C program. When the program runs, the operating system invokes main(). The "int" return type indicates that main returns an integer status code back to the operating system; returning 0 signifies normal successful termination.',
    `#include <stdio.h>

int main() {
    printf("Execution always begins at main()!\\n");
    return 0; // 0 tells the OS the program exited cleanly
}`,
    'Execution always begins at main()!',
    5
  );

  insertSolved.run(
    'sq-2-1',
    'day-2',
    'How do you declare variables of different primitive data types and print their sizes in C?',
    'In C, the sizeof operator returns the memory size in bytes allocated for a variable or type. Standard types include int, float, double, and char.',
    `#include <stdio.h>

int main() {
    int a = 42;
    float b = 3.14f;
    char c = 'A';
    double d = 9.81;

    printf("int: %d (size: %lu bytes)\\n", a, sizeof(a));
    printf("float: %.2f (size: %lu bytes)\\n", b, sizeof(b));
    printf("char: %c (size: %lu byte)\\n", c, sizeof(c));
    printf("double: %.2f (size: %lu bytes)\\n", d, sizeof(d));
    return 0;
}`,
    'int: 42 (size: 4 bytes)\nfloat: 3.14 (size: 4 bytes)\nchar: A (size: 1 byte)\ndouble: 9.81 (size: 8 bytes)',
    1
  );

  const insertHomework = db.prepare(`
    INSERT INTO homework_questions (id, day_id, question, starter_code, difficulty, published, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertHomework.run(
    'hw-1-1',
    'day-1',
    'Write a C program that prints:\n\nHello World\nWelcome to C Programming',
    `#include <stdio.h>

int main() {
    // Write your code to print:
    // Hello World
    // Welcome to C Programming
    
    printf("Hello World\\n");
    printf("Welcome to C Programming\\n");
    
    return 0;
}`,
    'Easy',
    1,
    new Date().toISOString()
  );

  insertHomework.run(
    'hw-2-1',
    'day-2',
    'Declare three variables: an integer age with value 20, a float gpa with value 3.85, and a char grade with value \'A\'. Print them on separate lines with descriptive labels.',
    `#include <stdio.h>

int main() {
    // Declare age, gpa, and grade here
    
    return 0;
}`,
    'Easy',
    1,
    new Date().toISOString()
  );

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotification.run('notif-1', 'usr-student-1', 'Welcome to C Programming Academy!', 'Start with Day 1: Introduction to C Programming. Study notes, try solved questions, and submit your first homework.', 'welcome', 0, new Date().toISOString());
  insertNotification.run('notif-2', 'usr-student-1', 'Day 1 Resources Available', 'Prof. Alan Mitchell has published the presentation slides and notes for Day 1.', 'resource', 0, new Date().toISOString());

  console.log('Seeding completed successfully!');
} else {
  console.log('Database already seeded with users and curriculum.');
}
