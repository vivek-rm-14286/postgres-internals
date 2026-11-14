import type { Dataset, Exercise } from '../types'

export const dataset: Dataset = {
  id: 'shop',
  title: 'Online shop',
  description: 'A small store: customers in a few countries, a product catalogue with categories, and orders with line items over 2025.',
  setup: `
CREATE TABLE customers (id int PRIMARY KEY, name text NOT NULL, email text UNIQUE, country text NOT NULL, signed_up date NOT NULL);
CREATE TABLE categories (id int PRIMARY KEY, name text NOT NULL, parent_id int REFERENCES categories(id));
CREATE TABLE products (id int PRIMARY KEY, name text NOT NULL, category_id int NOT NULL REFERENCES categories(id), price numeric(10,2) NOT NULL, stock int NOT NULL);
CREATE TABLE orders (id int PRIMARY KEY, customer_id int NOT NULL REFERENCES customers(id), ordered_at timestamptz NOT NULL, status text NOT NULL CHECK (status IN ('pending','paid','shipped','cancelled')));
CREATE TABLE order_items (order_id int REFERENCES orders(id), product_id int REFERENCES products(id), quantity int NOT NULL CHECK (quantity > 0), unit_price numeric(10,2) NOT NULL, PRIMARY KEY (order_id, product_id));

INSERT INTO customers VALUES
 (1,'Ada Lovelace','ada@example.com','UK','2024-11-02'), (2,'Alan Turing','alan@example.com','UK','2025-01-15'),
 (3,'Grace Hopper','grace@example.com','US','2024-12-20'), (4,'Linus Torvalds',NULL,'FI','2025-03-08'),
 (5,'Margaret Hamilton','margaret@example.com','US','2025-02-11'), (6,'Edsger Dijkstra','edsger@example.com','NL','2025-05-30'),
 (7,'Barbara Liskov','barbara@example.com','US','2025-06-01'), (8,'Ken Thompson',NULL,'US','2025-07-19');
INSERT INTO categories VALUES (1,'Electronics',NULL),(2,'Laptops',1),(3,'Phones',1),(4,'Books',NULL),(5,'Programming',4),(6,'Accessories',1);
INSERT INTO products VALUES
 (1,'ThinkPad X1',2,1899.00,12),(2,'MacBook Air',2,1299.00,0),(3,'Pixel 9',3,799.00,25),(4,'iPhone 16',3,999.00,8),
 (5,'SICP',5,49.90,40),(6,'The C Programming Language',5,39.50,15),(7,'USB-C Hub',6,59.00,100),(8,'Mechanical Keyboard',6,129.00,0);
INSERT INTO orders VALUES
 (101,1,'2025-01-05 10:00+00','shipped'),(102,3,'2025-01-20 15:30+00','shipped'),(103,1,'2025-10-14 09:12+00','paid'),
 (104,2,'2025-03-01 18:45+00','cancelled'),(105,5,'2025-03-22 11:00+00','shipped'),(106,4,'2025-04-10 08:20+00','paid'),
 (107,3,'2025-06-02 20:05+00','shipped'),(108,7,'2025-07-07 13:40+00','pending'),(109,6,'2025-08-15 16:00+00','shipped'),
 (110,1,'2025-09-30 12:00+00','paid');
INSERT INTO order_items VALUES
 (101,1,1,1899.00),(101,7,2,59.00),(102,5,1,49.90),(102,6,1,39.50),(103,3,1,799.00),(104,2,3,1299.00),
 (105,4,1,999.00),(105,7,1,59.00),(106,8,2,129.00),(107,5,2,49.90),(108,1,1,1899.00),(109,6,3,39.50),(110,3,2,799.00),(110,7,1,59.00);`,
  tables: [
    { name: 'customers', columns: 'id int PK, name text, email text UNIQUE NULL, country text, signed_up date' },
    { name: 'categories', columns: 'id int PK, name text, parent_id int → categories' },
    { name: 'products', columns: 'id int PK, name text, category_id int → categories, price numeric(10,2), stock int' },
    { name: 'orders', columns: "id int PK, customer_id int → customers, ordered_at timestamptz, status 'pending'|'paid'|'shipped'|'cancelled'" },
    { name: 'order_items', columns: 'order_id → orders, product_id → products, quantity int, unit_price numeric(10,2); PK (order_id, product_id)' },
  ],
}

export const exercises: Exercise[] = [
  {
    id: 'shop-us-customers', dataset: 'shop', level: 'beginner', topic: 'filtering',
    title: 'Customers in the US',
    task: 'Return the `name` and `email` of every customer whose `country` is `US`, sorted by `name`.',
    hint: 'Filter with `WHERE`, sort with `ORDER BY`.',
    solution: `SELECT name, email FROM customers WHERE country = 'US' ORDER BY name;`,
    explanation: 'String literals use single quotes. Without `ORDER BY` PostgreSQL returns rows in whatever order is cheapest, which is not guaranteed to be stable.',
    ordered: true,
  },
  {
    id: 'shop-missing-email', dataset: 'shop', level: 'beginner', topic: 'NULL handling',
    title: 'Customers without an email',
    task: 'Return the `id` and `name` of customers who have **no** email address.',
    hint: '`= NULL` never matches anything.',
    solution: `SELECT id, name FROM customers WHERE email IS NULL;`,
    explanation: 'Comparing anything with NULL using `=` gives NULL, not true, so `WHERE email = NULL` returns no rows. Use `IS NULL` / `IS NOT NULL`.',
  },
  {
    id: 'shop-revenue-by-category', dataset: 'shop', level: 'intermediate', topic: 'joins',
    title: 'Revenue per top-level category',
    task: 'For each **top-level** category (no parent), return `category` and `revenue` = the sum of `quantity * unit_price` over all non-cancelled orders of products in that category or its direct subcategories. Sort by revenue, highest first.',
    hint: 'Map each product to its top-level category with `COALESCE(parent_id, id)`.',
    solution: `SELECT top.name AS category, sum(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders o     ON o.id = oi.order_id AND o.status <> 'cancelled'
JOIN products p   ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id
JOIN categories top ON top.id = COALESCE(c.parent_id, c.id)
GROUP BY top.name
ORDER BY revenue DESC;`,
    explanation: '`COALESCE(c.parent_id, c.id)` rolls a subcategory up to its parent in one step (enough for a two-level tree; deeper trees need a recursive CTE). Filtering cancelled orders in the `JOIN … ON` or in `WHERE` is equivalent here because it is an inner join.',
    ordered: true,
  },
  {
    id: 'shop-latest-order-per-customer', dataset: 'shop', level: 'advanced', topic: 'top-N per group',
    title: 'Each customer’s most recent order',
    task: 'Return `customer`, `order_id` and `ordered_at` for the latest order of every customer who has ordered at least once. Customers with no orders are not listed.',
    hint: 'Try `DISTINCT ON`, a window function, or `LATERAL … LIMIT 1`.',
    solution: `SELECT DISTINCT ON (c.id) c.name AS customer, o.id AS order_id, o.ordered_at
FROM customers c
JOIN orders o ON o.customer_id = c.id
ORDER BY c.id, o.ordered_at DESC;`,
    explanation: '`DISTINCT ON (c.id)` keeps the first row per customer in `ORDER BY` order, so ordering by `ordered_at DESC` within each customer picks the latest. The `row_number() OVER (PARTITION BY …)` and `LATERAL (… LIMIT 1)` forms give the same rows. Taking `max(o.id)` assumes ids follow time; Ada’s order 103 is newer than her order 110.',
  },
  {
    id: 'shop-price-range', dataset: 'shop', level: 'beginner', topic: 'filtering',
    title: 'Products in a price range',
    task: 'Return `name` and `price` of products priced from 59.00 to 999.00, **both ends included**, most expensive first.',
    solution: `SELECT name, price FROM products WHERE price BETWEEN 59 AND 999 ORDER BY price DESC;`,
    explanation: '`BETWEEN a AND b` is inclusive at both ends, the same as `>= a AND <= b`. Two products sit exactly on the boundaries, so `> 59 AND < 999` loses them.',
    ordered: true,
  },
  {
    id: 'shop-orders-by-status', dataset: 'shop', level: 'beginner', topic: 'aggregates',
    title: 'Orders per status',
    task: 'Return `status` and `orders` (how many orders have that status).',
    solution: `SELECT status, count(*) AS orders FROM orders GROUP BY status;`,
    explanation: '`GROUP BY` forms one group per distinct status, and `count(*)` counts the rows in each.',
  },
  {
    id: 'shop-name-search', dataset: 'shop', level: 'beginner', topic: 'strings',
    title: 'Case-insensitive name search',
    task: 'Return the `name` of every customer whose name contains the letters `li`, in **any** letter case.',
    hint: '`LIKE` is case-sensitive.',
    solution: `SELECT name FROM customers WHERE name ILIKE '%li%';`,
    explanation: 'Both matches start a word with a capital, so `LIKE \'%li%\'` finds nothing. `ILIKE` compares case-insensitively; `lower(name) LIKE \'%li%\'` works too, and a leading `%` means no ordinary B-tree index can help either way.',
  },
  {
    id: 'shop-top3-expensive', dataset: 'shop', level: 'beginner', topic: 'sorting',
    title: 'Three most expensive products',
    task: 'Return `name` and `price` of the three most expensive products, most expensive first.',
    solution: `SELECT name, price FROM products ORDER BY price DESC LIMIT 3;`,
    explanation: '`LIMIT` applies after `ORDER BY`, so you get the top three by price. Without the `ORDER BY`, `LIMIT 3` returns three arbitrary rows.',
    ordered: true,
  },
  {
    id: 'shop-no-real-orders', dataset: 'shop', level: 'intermediate', topic: 'anti-joins',
    title: 'Customers who never really bought',
    task: 'Return `id` and `name` of customers with **no order other than cancelled ones** (no orders at all also counts).',
    solution: `SELECT c.id, c.name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status <> 'cancelled');`,
    explanation: 'Alan placed one order and cancelled it; Ken never ordered. A `LEFT JOIN orders … WHERE o.id IS NULL` finds only Ken, unless the status test moves into the `ON` clause. `NOT EXISTS` with the condition inside the subquery says exactly what is meant.',
  },
  {
    id: 'shop-orders-per-month', dataset: 'shop', level: 'intermediate', topic: 'dates & time zones',
    title: 'Orders per month',
    task: 'Return `month` (the first day of the month, as a `date`) and `orders` (number of orders placed that month, any status), oldest month first. Months without orders are not listed.',
    solution: `SELECT date_trunc('month', ordered_at)::date AS month, count(*) AS orders
FROM orders GROUP BY month ORDER BY month;`,
    explanation: '`date_trunc(\'month\', …)` maps every timestamp to the start of its month, so grouping by it buckets the orders; the cast turns the result into a `date`. Grouping by `extract(month …)` alone would merge the same month of different years.',
    ordered: true,
  },
  {
    id: 'shop-big-orders', dataset: 'shop', level: 'intermediate', topic: 'aggregates',
    title: 'Orders over 1,000',
    task: 'Return `order_id` and `total` (sum of `quantity * unit_price`) for every **non-cancelled** order whose total is above 1000.',
    solution: `SELECT oi.order_id, sum(oi.quantity * oi.unit_price) AS total
FROM order_items oi JOIN orders o ON o.id = oi.order_id
WHERE o.status <> 'cancelled'
GROUP BY oi.order_id
HAVING sum(oi.quantity * oi.unit_price) > 1000;`,
    explanation: 'The status test is about rows, so it goes in `WHERE`; the total exists only per group, so its test goes in `HAVING`. Testing `unit_price > 1000` in `WHERE` instead would keep only single expensive lines and miss orders that add up past the limit.',
  },
  {
    id: 'shop-repeat-after-q1', dataset: 'shop', level: 'intermediate', topic: 'set operations',
    title: 'Ordered in the first quarter and again later',
    task: 'Return the `id` and `name` of every customer who has a non-cancelled order **in the first quarter of 2025** (January to March) and also a non-cancelled order **on or after 1 April 2025**. One row per customer, sorted by `id`.',
    hint: '`INTERSECT` keeps the rows that two queries have in common.',
    solution: `SELECT c.id, c.name FROM customers c JOIN orders o ON o.customer_id = c.id
WHERE o.status <> 'cancelled' AND o.ordered_at >= '2025-01-01' AND o.ordered_at < '2025-04-01'
INTERSECT
SELECT c.id, c.name FROM customers c JOIN orders o ON o.customer_id = c.id
WHERE o.status <> 'cancelled' AND o.ordered_at >= '2025-04-01'
ORDER BY id;`,
    explanation: '`INTERSECT` returns the rows present in both results and removes duplicates, so Ada, who has two later orders, appears once. A single `WHERE` with both date conditions on the same order row matches nothing, because no one order is in both periods. The final `ORDER BY` applies to the combined result.',
    ordered: true,
  },
  {
    id: 'shop-price-bands', dataset: 'shop', level: 'intermediate', topic: 'CASE',
    title: 'Products by price band',
    task: 'Put every product in a band: `budget` (under 100), `mid` (100 up to but not including 1000), `premium` (1000 or more). Return `band` and `products` (how many products are in it).',
    solution: `SELECT CASE WHEN price < 100 THEN 'budget'
            WHEN price < 1000 THEN 'mid'
            ELSE 'premium' END AS band,
       count(*) AS products
FROM products GROUP BY band;`,
    explanation: '`CASE` picks the first branch that is true, so each later test only needs the upper bound. `GROUP BY band` may refer to the output alias; repeating the whole `CASE` expression works too.',
  },
  {
    id: 'shop-avg-order-value', dataset: 'shop', level: 'intermediate', topic: 'subqueries',
    title: 'Average order value per country',
    task: 'For each customer country, return `country` and `avg_order`: the average **order** total (sum of its lines) over non-cancelled orders, rounded to 2 decimals. Countries without such orders are not listed.',
    hint: 'Compute one total per order first, then average those.',
    solution: `SELECT c.country, round(avg(t.total), 2) AS avg_order
FROM (
  SELECT order_id, sum(quantity * unit_price) AS total FROM order_items GROUP BY order_id
) t
JOIN orders o ON o.id = t.order_id AND o.status <> 'cancelled'
JOIN customers c ON c.id = o.customer_id
GROUP BY c.country;`,
    explanation: 'Joining customers straight to `order_items` and taking `avg(quantity * unit_price)` averages **lines**, not orders, and an order with two lines counts twice. Aggregating to one row per order in a derived table first gives the right granularity.',
  },
  {
    id: 'shop-category-paths', dataset: 'shop', level: 'advanced', topic: 'recursive CTEs',
    title: 'Category breadcrumbs',
    task: 'Return `name` and `path` for every category, where `path` lists the names from the top-level category down, joined with `\' > \'` (e.g. `Electronics > Laptops`). Order by `path`.',
    solution: `WITH RECURSIVE tree AS (
  SELECT id, name, name AS path FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.name, t.path || ' > ' || c.name
  FROM categories c JOIN tree t ON c.parent_id = t.id
)
SELECT name, path FROM tree ORDER BY path;`,
    explanation: 'The anchor selects the roots; each recursive step attaches the children of rows found so far and extends their path. Unlike a fixed self-join, this works for any depth of tree.',
    ordered: true,
  },
  {
    id: 'shop-running-revenue', dataset: 'shop', level: 'advanced', topic: 'window functions',
    title: 'Running revenue',
    task: 'For every non-cancelled order, in time order, return `order_id`, `ordered_at`, `total` (sum of its lines) and `running_total`: revenue of all non-cancelled orders up to and including this one.',
    solution: `SELECT o.id AS order_id, o.ordered_at, sum(oi.quantity * oi.unit_price) AS total,
       sum(sum(oi.quantity * oi.unit_price)) OVER (ORDER BY o.ordered_at) AS running_total
FROM orders o JOIN order_items oi ON oi.order_id = o.id
WHERE o.status <> 'cancelled'
GROUP BY o.id
ORDER BY o.ordered_at;`,
    explanation: 'Window functions are evaluated after `GROUP BY`, so `sum(sum(…)) OVER (ORDER BY …)` runs a window sum over the per-order totals. With `ORDER BY` in the window, the default frame runs from the first row to the current one (and peers with the same timestamp, of which there are none here).',
    ordered: true,
  },
  {
    id: 'shop-revenue-share', dataset: 'shop', level: 'advanced', topic: 'window functions',
    title: 'Each product’s share of revenue',
    task: 'For every product sold in a non-cancelled order, return `product` (its name), `revenue` = the sum of `quantity * unit_price` over non-cancelled orders, and `pct` = that revenue as a percentage of the total non-cancelled revenue, rounded to 1 decimal. Sort by `revenue`, highest first.',
    hint: 'A window function can run over the result of `GROUP BY`: `sum(sum(x)) OVER ()` is the grand total.',
    solution: `SELECT p.name AS product,
       sum(oi.quantity * oi.unit_price) AS revenue,
       round(100 * sum(oi.quantity * oi.unit_price) / sum(sum(oi.quantity * oi.unit_price)) OVER (), 1) AS pct
FROM order_items oi
JOIN orders o   ON o.id = oi.order_id AND o.status <> 'cancelled'
JOIN products p ON p.id = oi.product_id
GROUP BY p.name
ORDER BY revenue DESC;`,
    explanation: 'Window functions are evaluated after grouping, so the inner `sum(…)` is the per-product aggregate and the outer `sum(…) OVER ()` adds those up across all groups. An empty `OVER ()` makes the whole result one window. The MacBook Air appears only in a cancelled order, so it is not listed and does not count towards the total.',
    ordered: true,
  },
  {
    id: 'shop-status-pivot', dataset: 'shop', level: 'advanced', topic: 'aggregates',
    title: 'Order statuses per country',
    task: 'Return one row per customer country with `country` and four columns `pending`, `paid`, `shipped`, `cancelled`, each counting that country’s orders with that status (0 when none). Countries whose customers have no orders still appear, with zeros.',
    solution: `SELECT c.country,
       count(o.id) FILTER (WHERE o.status = 'pending')   AS pending,
       count(o.id) FILTER (WHERE o.status = 'paid')      AS paid,
       count(o.id) FILTER (WHERE o.status = 'shipped')   AS shipped,
       count(o.id) FILTER (WHERE o.status = 'cancelled') AS cancelled
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.country;`,
    explanation: 'An aggregate with `FILTER (WHERE …)` only sees the rows that pass the filter, which turns the status values into columns in a single pass. `count` returns 0 for an empty set, whereas `sum(CASE WHEN … THEN 1 END)` returns NULL.',
  },
  {
    id: 'shop-top3-per-category', dataset: 'shop', level: 'advanced', topic: 'top-N per group',
    title: 'Best sellers per top-level category',
    task: 'Count units sold (sum of `quantity` over non-cancelled orders) per product. For each **top-level** category, return `category`, `product` and `units` for products ranked in the top 3 by units, **ties included** (a tie for third place returns both).',
    solution: `SELECT category, product, units FROM (
  SELECT top.name AS category, p.name AS product, sum(oi.quantity) AS units,
         rank() OVER (PARTITION BY top.id ORDER BY sum(oi.quantity) DESC) AS r
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
  JOIN products p ON p.id = oi.product_id
  JOIN categories c ON c.id = p.category_id
  JOIN categories top ON top.id = COALESCE(c.parent_id, c.id)
  GROUP BY top.id, top.name, p.id, p.name
) t WHERE r <= 3;`,
    explanation: 'Rank inside each top-level category after aggregating, then filter in an outer query (window results cannot be used in `WHERE`). ThinkPad and keyboard tie on 2 units for third place in Electronics; `rank()` keeps both, `row_number()` keeps an arbitrary one. Leaving the cancelled order in would lift the MacBook (3 units) into second place and push both of them out.',
  },
  {
    id: 'shop-upsert-stock', dataset: 'shop', level: 'expert', topic: 'data changes',
    title: 'Book in a delivery',
    task: 'A delivery arrived: 20 × product 7, 30 × product 8, and 10 × a new product 9, `Programming Rust` (category 5, price 59.90). In one statement, insert the new product and **add** the delivered quantity to the stock of existing ones. The check lists every column of every product.',
    hint: '`INSERT … ON CONFLICT (id) DO UPDATE SET stock = …`. Which row does `EXCLUDED` refer to?',
    solution: `INSERT INTO products (id, name, category_id, price, stock) VALUES
  (7, 'USB-C Hub', 6, 59.00, 20),
  (8, 'Mechanical Keyboard', 6, 129.00, 30),
  (9, 'Programming Rust', 5, 59.90, 10)
ON CONFLICT (id) DO UPDATE SET stock = products.stock + EXCLUDED.stock;`,
    explanation: 'In `DO UPDATE`, the table name refers to the existing row and `EXCLUDED` to the row you tried to insert. `SET stock = EXCLUDED.stock` overwrites the hub’s 100 units with 20 instead of adding them. The upsert is atomic, so no concurrent insert can slip in between a check and the write.',
    check: `SELECT id, name, category_id, price, stock FROM products ORDER BY id;`,
    ordered: true,
  },
  {
    id: 'shop-revenue-rollup', dataset: 'shop', level: 'expert', topic: 'aggregates',
    title: 'Revenue with subtotals',
    task: 'Over non-cancelled orders, return `country`, `category` (top-level category name) and `revenue` (sum of `quantity * unit_price`) for every country–category pair, **plus** one subtotal row per country (category NULL) and one grand-total row (both NULL), all from one query.',
    solution: `SELECT cu.country, top.name AS category, sum(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
JOIN customers cu ON cu.id = o.customer_id
JOIN products p ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id
JOIN categories top ON top.id = COALESCE(c.parent_id, c.id)
GROUP BY GROUPING SETS ((cu.country, top.name), (cu.country), ());`,
    explanation: '`GROUPING SETS` computes several groupings in one pass and fills the columns a set does not group by with NULL; here that is the same as `ROLLUP (cu.country, top.name)`. When the data itself can contain NULLs, `GROUPING(col)` tells a subtotal row from a real NULL group.',
  },
  {
    id: 'shop-restock', dataset: 'shop', level: 'intermediate', topic: 'data changes',
    title: 'Restock everything that is sold out',
    task: 'In **one statement**, set `stock = 50` for every product whose stock is 0, and return the `id` and `name` of the products you changed. The check lists `id` and `stock` of all products afterwards; it compares only the table, so the returned rows are for you to see.',
    hint: '`UPDATE … RETURNING`.',
    solution: `UPDATE products SET stock = 50 WHERE stock = 0 RETURNING id, name;`,
    explanation: '`RETURNING` sends back the modified rows, which saves a second round trip and avoids a race between "find" and "change". The checker compares the whole table afterwards.',
    check: `SELECT id, stock FROM products ORDER BY id;`,
    ordered: true,
  },
]
