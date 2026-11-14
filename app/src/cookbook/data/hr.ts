import type { Dataset, Exercise } from '../types'

export const dataset: Dataset = {
  id: 'hr',
  title: 'Company HR',
  description: 'Twenty employees in a five-level reporting chain across a handful of departments, with each person’s salary history. Two people have no department, one department is empty, and some salaries tie.',
  setup: `
CREATE TABLE departments (id int PRIMARY KEY, name text NOT NULL UNIQUE, location text NOT NULL);
CREATE TABLE employees (
  id int PRIMARY KEY, name text NOT NULL, title text NOT NULL,
  dept_id int REFERENCES departments(id), manager_id int REFERENCES employees(id),
  hired_on date NOT NULL, salary int NOT NULL, commission_pct numeric(4,2));
CREATE TABLE salary_history (emp_id int NOT NULL REFERENCES employees(id), effective_from date NOT NULL, salary int NOT NULL, PRIMARY KEY (emp_id, effective_from));

INSERT INTO departments VALUES
 (1,'Engineering','Berlin'),(2,'Sales','London'),(3,'Finance','London'),(4,'Marketing','Paris'),(5,'Legal','Berlin');
INSERT INTO employees VALUES
 (1,'Ruth Ortega','CEO',NULL,NULL,'2015-03-01',250000,NULL),
 (2,'Sam Patel','CTO',1,1,'2016-06-15',190000,NULL),
 (3,'Lena Fischer','VP Sales',2,1,'2017-01-09',170000,0.05),
 (4,'Omar Haddad','CFO',3,1,'2016-11-01',180000,NULL),
 (5,'Mia Chen','Engineering Manager',1,2,'2018-04-02',150000,NULL),
 (6,'Jonas Berg','Engineering Manager',1,2,'2019-08-19',145000,NULL),
 (7,'Priya Nair','Senior Engineer',1,5,'2019-02-11',126000,NULL),
 (8,'Diego Alvarez','Engineer',1,5,'2021-07-01',110000,NULL),
 (9,'Hana Sato','Engineer',1,5,'2022-09-12',110000,NULL),
 (10,'Tom Becker','Senior Engineer',1,6,'2020-01-06',148000,NULL),
 (11,'Aisha Bello','Engineer',1,6,'2024-03-18',98000,NULL),
 (12,'Noah Kim','Intern',1,10,'2025-06-02',45000,NULL),
 (13,'Elena Rossi','Account Executive',2,3,'2018-10-22',175000,0.10),
 (14,'Kwame Mensah','Account Executive',2,3,'2020-05-04',90000,NULL),
 (15,'Sofia Lind','Account Executive',2,3,'2023-02-27',82000,0.08),
 (16,'Yuki Tanaka','Accountant',3,4,'2017-09-05',95000,NULL),
 (17,'Ben Carter','Accountant',3,4,'2022-01-01',78000,NULL),
 (18,'Zara Malik','Counsel',5,1,'2021-11-15',160000,NULL),
 (19,'Leo Dubois','Contractor',NULL,2,'2024-12-01',70000,NULL),
 (20,'Ivy Moreno','Analyst',3,16,'2022-12-31',65000,NULL);
INSERT INTO salary_history VALUES
 (1,'2015-03-01',200000),(1,'2019-01-01',230000),(1,'2023-01-01',250000),
 (2,'2016-06-15',150000),(2,'2020-01-01',170000),(2,'2023-07-01',190000),
 (3,'2017-01-09',140000),(3,'2022-01-01',170000),
 (5,'2018-04-02',110000),(5,'2021-04-01',130000),(5,'2024-04-01',150000),
 (7,'2019-02-11',100000),(7,'2022-02-11',120000),(7,'2024-02-11',126000),
 (8,'2021-07-01',95000),(8,'2023-01-01',110000),
 (10,'2020-01-06',105000),(10,'2023-01-02',130000),(10,'2025-01-06',148000),
 (13,'2018-10-22',70000),(13,'2021-01-01',120000),(13,'2024-01-01',175000),
 (16,'2017-09-05',80000),(16,'2020-09-05',95000);`,
  tables: [
    { name: 'departments', columns: 'id int PK, name text UNIQUE, location text' },
    { name: 'employees', columns: 'id int PK, name text, title text, dept_id int NULL → departments, manager_id int NULL → employees, hired_on date, salary int, commission_pct numeric(4,2) NULL' },
    { name: 'salary_history', columns: 'emp_id int → employees, effective_from date, salary int; PK (emp_id, effective_from)' },
  ],
}

export const exercises: Exercise[] = [
  // ── beginner ──────────────────────────────────────────────────────────────
  {
    id: 'hr-hired-2022', dataset: 'hr', level: 'beginner', topic: 'dates',
    title: 'Hired in 2022',
    task: 'Return the `name` and `hired_on` of everyone hired during calendar year 2022 (1 January to 31 December inclusive), sorted by `hired_on`.',
    hint: 'A half-open range `>= start AND < next start` never misses the last day.',
    solution: `SELECT name, hired_on FROM employees
WHERE hired_on >= '2022-01-01' AND hired_on < '2023-01-01'
ORDER BY hired_on;`,
    explanation: 'Two people were hired exactly on the boundaries (1 January and 31 December), so `> \'2022-01-01\'` or `< \'2022-12-31\'` each lose one row. The half-open form `>= start AND < next_start` is the habit to build: it also works unchanged for `timestamp` columns, where `BETWEEN … AND \'2022-12-31\'` would stop at midnight.',
    ordered: true,
  },
  {
    id: 'hr-total-comp', dataset: 'hr', level: 'beginner', topic: 'NULL handling',
    title: 'Total compensation in Sales',
    task: 'For every employee in department 2 (Sales), return `name` and `total_comp` = `salary * (1 + commission_pct)`, treating a missing commission as 0.',
    hint: 'Any arithmetic with NULL gives NULL.',
    solution: `SELECT name, salary * (1 + COALESCE(commission_pct, 0)) AS total_comp
FROM employees WHERE dept_id = 2;`,
    explanation: 'Kwame has no commission, so `salary * (1 + commission_pct)` is NULL for him rather than his salary. `COALESCE(commission_pct, 0)` substitutes the zero the task asks for.',
  },
  {
    id: 'hr-headcount', dataset: 'hr', level: 'beginner', topic: 'aggregates',
    title: 'Headcount per department id',
    task: 'Return `dept_id` and `headcount` (number of employees) for every `dept_id` value that appears in `employees`, **including** the group of employees with no department (`dept_id` NULL).',
    solution: `SELECT dept_id, count(*) AS headcount FROM employees GROUP BY dept_id;`,
    explanation: '`GROUP BY` puts all NULLs in one group, so the two people without a department show up as a row with `dept_id` NULL. Departments with nobody in them do not appear at all, because grouping only sees rows that exist in `employees`.',
  },
  {
    id: 'hr-top-earners', dataset: 'hr', level: 'beginner', topic: 'sorting',
    title: 'Five best-paid employees',
    task: 'Return `name` and `salary` of the five highest-paid employees, highest first.',
    solution: `SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 5;`,
    explanation: '`ORDER BY … DESC LIMIT n` is the standard top-N. The fifth and sixth salaries differ here, so the result is well defined; when they tie, add a tie-breaker column or use `FETCH FIRST 5 ROWS WITH TIES`.',
    ordered: true,
  },
  {
    id: 'hr-unassigned', dataset: 'hr', level: 'beginner', topic: 'NULL handling',
    title: 'No manager or no department',
    task: 'Return the `name` of every employee who has no manager **or** no department (or both).',
    solution: `SELECT name FROM employees WHERE manager_id IS NULL OR dept_id IS NULL;`,
    explanation: 'The CEO has neither, the contractor has only a manager. `IS NULL` is the only test that matches a missing value; `dept_id = NULL` is never true.',
  },

  // ── intermediate ─────────────────────────────────────────────────────────
  {
    id: 'hr-emp-manager', dataset: 'hr', level: 'intermediate', topic: 'self-joins',
    title: 'Who reports to whom',
    task: 'Return `employee` (name) and `manager` (the manager’s name) for **every** employee. The CEO has no manager: show NULL.',
    hint: 'Join `employees` to itself under a second alias.',
    solution: `SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;`,
    explanation: 'A self-join uses two aliases for the same table. It must be a `LEFT JOIN`: an inner join drops the CEO, whose `manager_id` is NULL and matches nobody.',
  },
  {
    id: 'hr-dept-avg', dataset: 'hr', level: 'intermediate', topic: 'GROUP BY / HAVING',
    title: 'Well-paid departments',
    task: 'Return `department` (name) and `avg_salary` (rounded to 2 decimals) for departments whose average salary is **above 124000**.',
    solution: `SELECT d.name AS department, round(avg(e.salary), 2) AS avg_salary
FROM departments d JOIN employees e ON e.dept_id = d.id
GROUP BY d.name
HAVING avg(e.salary) > 124000;`,
    explanation: '`WHERE` filters rows before grouping; a condition on an aggregate belongs in `HAVING`, which filters groups. Engineering clears the bar by a few hundred, Finance does not; a `WHERE salary > 124000` would instead average only the high earners and let every department through.',
  },
  {
    id: 'hr-out-earn-manager', dataset: 'hr', level: 'intermediate', topic: 'self-joins',
    title: 'Earning more than the boss',
    task: 'Return `employee`, `salary`, `manager`, `manager_salary` for every employee whose salary is strictly greater than their manager’s.',
    solution: `SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;`,
    explanation: 'Join each employee row to its manager row, then compare columns across the two aliases. An inner join is right here: people without a manager have nobody to out-earn.',
  },
  {
    id: 'hr-empty-departments', dataset: 'hr', level: 'intermediate', topic: 'anti-joins',
    title: 'Departments with nobody in them',
    task: 'Return the `name` of every department that has no employees.',
    hint: 'Try `NOT IN (SELECT dept_id FROM employees)` first, and see what happens.',
    solution: `SELECT d.name FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id);`,
    explanation: 'The classic trap: `NOT IN (SELECT dept_id FROM employees)` returns **no rows**, because the list contains NULLs and `x NOT IN (…, NULL)` is NULL, never true. `NOT EXISTS` (or `LEFT JOIN … WHERE e.id IS NULL`) is NULL-safe and usually planned as an efficient anti-join.',
  },
  {
    id: 'hr-tenure', dataset: 'hr', level: 'intermediate', topic: 'dates',
    title: 'Completed years of service',
    task: 'Return `name` and `years` = the number of **completed** years between `hired_on` and `2025-12-31` (an int; someone hired 2022-12-31 has completed exactly 3).',
    hint: '`age(later, earlier)` returns a calendar interval.',
    solution: `SELECT name, extract(year FROM age(date '2025-12-31', hired_on))::int AS years FROM employees;`,
    explanation: '`age()` counts calendar years and months, so anniversaries land exactly. Dividing the day difference by 365 drifts by a day every leap year: Ben, hired 2022-01-01, is 1460 days in, which `/ 365` calls 4 years although his fourth anniversary is the next day.',
  },

  // ── advanced ─────────────────────────────────────────────────────────────
  {
    id: 'hr-org-chart', dataset: 'hr', level: 'advanced', topic: 'recursive CTEs',
    title: 'The full org chart',
    task: 'Return `name`, `depth` (CEO = 0, their direct reports = 1, …) and `path`, the chain of names from the CEO down to the employee joined with `\' > \'` (for the CEO just `Ruth Ortega`). One row per employee.',
    hint: '`WITH RECURSIVE`: start from the row with no manager, then join children onto the rows found so far.',
    solution: `WITH RECURSIVE chart AS (
  SELECT id, name, 0 AS depth, name AS path FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, c.depth + 1, c.path || ' > ' || e.name
  FROM employees e JOIN chart c ON e.manager_id = c.id
)
SELECT name, depth, path FROM chart;`,
    explanation: 'The non-recursive part seeds the CEO; each iteration joins the next level of reports onto the previous one until no new rows appear. Carrying `depth` and `path` along in the recursive part is how you build per-row context that a plain join cannot.',
  },
  {
    id: 'hr-span-of-control', dataset: 'hr', level: 'advanced', topic: 'recursive CTEs',
    title: 'Everyone below each manager',
    task: 'For every employee who manages at least one person, return `manager` (name) and `reports` = the number of people below them at any depth (direct and indirect).',
    solution: `WITH RECURSIVE below AS (
  SELECT manager_id AS boss, id AS emp FROM employees WHERE manager_id IS NOT NULL
  UNION ALL
  SELECT b.boss, e.id FROM below b JOIN employees e ON e.manager_id = b.emp
)
SELECT m.name AS manager, count(*) AS reports
FROM below b JOIN employees m ON m.id = b.boss
GROUP BY m.name;`,
    explanation: 'Generate every (ancestor, descendant) pair: start with direct pairs and extend each by one level per iteration. Counting direct reports only (`GROUP BY manager_id`) gives the CEO 4 instead of 19.',
  },
  {
    id: 'hr-lowest-three', dataset: 'hr', level: 'advanced', topic: 'window functions',
    title: 'Three lowest salary levels per department',
    task: 'For each department (skip employees with no department), return `department`, `name`, `salary` for employees whose salary is among the **three lowest distinct salaries** in their department. Ties are all included.',
    hint: '`dense_rank()` numbers distinct values without gaps.',
    solution: `SELECT department, name, salary FROM (
  SELECT d.name AS department, e.name, e.salary,
         dense_rank() OVER (PARTITION BY e.dept_id ORDER BY e.salary) AS r
  FROM employees e JOIN departments d ON d.id = e.dept_id
) t WHERE r <= 3;`,
    explanation: 'Diego and Hana both earn 110000, the third-lowest Engineering salary, so the right answer has four Engineering rows. `row_number()` or a `LIMIT` per group silently drops one of them; `dense_rank()` gives tied values the same number.',
  },
  {
    id: 'hr-raises', dataset: 'hr', level: 'advanced', topic: 'lag / lead',
    title: 'Every raise, and how big it was',
    task: 'From `salary_history`, return one row per raise: `name`, `effective_from`, `old_salary`, `new_salary`, and `pct` = the increase in percent rounded to 1 decimal. An employee’s first history row is not a raise.',
    solution: `SELECT name, effective_from, old_salary, salary AS new_salary,
       round(100.0 * (salary - old_salary) / old_salary, 1) AS pct
FROM (
  SELECT e.name, h.effective_from, h.salary,
         lag(h.salary) OVER (PARTITION BY h.emp_id ORDER BY h.effective_from) AS old_salary
  FROM salary_history h JOIN employees e ON e.id = h.emp_id
) t
WHERE old_salary IS NOT NULL;`,
    explanation: '`lag()` reads the previous row in the window, here the previous salary of the same employee; partitioning keeps one person’s history from bleeding into the next. Window functions cannot appear in `WHERE`, so filter the first rows out in an outer query. Note `100.0 *`: with all-integer operands the division would truncate.',
  },
  {
    id: 'hr-salary-as-of', dataset: 'hr', level: 'advanced', topic: 'LATERAL',
    title: 'Salaries as of a date',
    task: 'Using `salary_history`, return `name` and `salary` = what each employee earned **on 2023-01-01** (the latest history row effective on or before that day). Leave out employees with no such row.',
    hint: '`CROSS JOIN LATERAL (… ORDER BY effective_from DESC LIMIT 1)`.',
    solution: `SELECT e.name, h.salary
FROM employees e
CROSS JOIN LATERAL (
  SELECT salary FROM salary_history s
  WHERE s.emp_id = e.id AND s.effective_from <= '2023-01-01'
  ORDER BY s.effective_from DESC LIMIT 1
) h;`,
    explanation: 'A `LATERAL` subquery runs per outer row and may reference it, so it can pick "the latest row before X" per employee. Two raises take effect exactly on 2023-01-01 (inclusive) and one on 2023-01-02 (excluded), so `<` versus `<=` matters. `CROSS JOIN` drops employees whose subquery returns nothing; `LEFT JOIN LATERAL … ON true` would keep them.',
  },

  // ── expert ───────────────────────────────────────────────────────────────
  {
    id: 'hr-raise-and-log', dataset: 'hr', level: 'expert', topic: 'data-modifying CTEs',
    title: 'Raise the lowest-paid engineers, with an audit trail',
    task: 'Give a 5% raise (rounded to a whole number) to every **Engineering** employee whose salary is below the Engineering average, and record each new salary in `salary_history` with `effective_from = \'2026-01-01\'`. Ideally in one statement. The check lists `id`, current `salary`, and the 2026 history salary for every employee.',
    hint: '`WITH raised AS (UPDATE … RETURNING …) INSERT INTO salary_history SELECT … FROM raised`.',
    solution: `WITH raised AS (
  UPDATE employees e SET salary = round(e.salary * 1.05)
  WHERE e.dept_id = (SELECT id FROM departments WHERE name = 'Engineering')
    AND e.salary < (SELECT avg(salary) FROM employees WHERE dept_id = e.dept_id)
  RETURNING e.id, e.salary
)
INSERT INTO salary_history (emp_id, effective_from, salary)
SELECT id, '2026-01-01', salary FROM raised;`,
    explanation: 'Every sub-statement of a `WITH` sees the same snapshot, so the average is computed from the salaries before the raise, and `RETURNING` hands the new values to the `INSERT`. Comparing against the company-wide average instead of the department’s picks the wrong people.',
    check: `SELECT e.id, e.salary, h.salary AS logged
FROM employees e LEFT JOIN salary_history h ON h.emp_id = e.id AND h.effective_from = '2026-01-01'
ORDER BY e.id;`,
    ordered: true,
  },
  {
    id: 'hr-share-high-earners', dataset: 'hr', level: 'expert', topic: 'integer division',
    title: 'Share of six-figure earners',
    task: 'For each department that has employees, return `department` and `pct` = the percentage of its employees earning **more than 100000**, as a numeric rounded to 1 decimal (Sales: 50.0).',
    hint: 'What is `3 / 4` in PostgreSQL?',
    solution: `SELECT d.name AS department,
       round(100.0 * count(*) FILTER (WHERE e.salary > 100000) / count(*), 1) AS pct
FROM departments d JOIN employees e ON e.dept_id = d.id
GROUP BY d.name;`,
    explanation: '`count()` returns bigint, and integer division truncates: `count(…) / count(*)` is 0 for every department below 100%, and `* 100` afterwards does not bring it back. Make one operand numeric *before* dividing (`100.0 * …`). `FILTER (WHERE …)` counts a subset inside the same group.',
  },
  {
    id: 'hr-dept-json', dataset: 'hr', level: 'expert', topic: 'JSON',
    title: 'Departments as JSON documents',
    task: 'Return one row per department (all five) with `department` and `staff`: a JSON array of objects `{"name": …, "salary": …}` ordered by salary descending, then name. A department with nobody in it gets an empty array `[]`, not NULL.',
    hint: '`json_agg(… ORDER BY …)` plus `COALESCE`.',
    solution: `SELECT d.name AS department,
       COALESCE(json_agg(json_build_object('name', e.name, 'salary', e.salary) ORDER BY e.salary DESC, e.name)
                FILTER (WHERE e.id IS NOT NULL), '[]') AS staff
FROM departments d LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.name;`,
    explanation: 'With a `LEFT JOIN`, an empty department still produces one row of NULLs, and `json_agg` would turn it into `[{"name":null,"salary":null}]`. `FILTER (WHERE e.id IS NOT NULL)` makes the aggregate see no rows, which yields NULL, and `COALESCE(…, \'[]\')` turns that into an empty array.',
  },
]
