/* Shared playground schema for e3 lessons 2 and 3: three colocated "distributed" tables modelled with
 * 4-way hash partitioning on one node, plus a small "reference" table. Not a lesson: no `lesson` export. */
export const ADS_SCHEMA = `-- Stand-in for three colocated distributed tables: 4 hash partitions each, all keyed by company
CREATE TABLE companies (id int PRIMARY KEY, name text NOT NULL, country text NOT NULL) PARTITION BY HASH (id);
CREATE TABLE companies_s0 PARTITION OF companies FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE companies_s1 PARTITION OF companies FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE companies_s2 PARTITION OF companies FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE companies_s3 PARTITION OF companies FOR VALUES WITH (MODULUS 4, REMAINDER 3);
CREATE TABLE campaigns (company_id int NOT NULL REFERENCES companies (id), id int NOT NULL, name text, budget numeric(10,2),
                        PRIMARY KEY (company_id, id)) PARTITION BY HASH (company_id);
CREATE TABLE campaigns_s0 PARTITION OF campaigns FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE campaigns_s1 PARTITION OF campaigns FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE campaigns_s2 PARTITION OF campaigns FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE campaigns_s3 PARTITION OF campaigns FOR VALUES WITH (MODULUS 4, REMAINDER 3);
CREATE TABLE ads (company_id int NOT NULL, id int NOT NULL, campaign_id int NOT NULL, clicks int NOT NULL,
                  PRIMARY KEY (company_id, id),
                  FOREIGN KEY (company_id, campaign_id) REFERENCES campaigns (company_id, id)) PARTITION BY HASH (company_id);
CREATE TABLE ads_s0 PARTITION OF ads FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE ads_s1 PARTITION OF ads FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE ads_s2 PARTITION OF ads FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE ads_s3 PARTITION OF ads FOR VALUES WITH (MODULUS 4, REMAINDER 3);
-- a small shared table: in Citus this would be a reference table
CREATE TABLE countries (code text PRIMARY KEY, name text NOT NULL);
INSERT INTO countries VALUES ('DE', 'Germany'), ('IN', 'India'), ('US', 'United States'), ('BR', 'Brazil');

INSERT INTO companies SELECT g, 'company ' || g, (ARRAY['DE', 'IN', 'US', 'BR'])[1 + g % 4] FROM generate_series(1, 40) g;
INSERT INTO campaigns SELECT 1 + g % 40, g, 'campaign ' || g, 100 + (g * 37) % 900 FROM generate_series(1, 400) g;
INSERT INTO ads SELECT c.company_id, c.id * 10 + k, c.id, (c.id + k) % 90 FROM campaigns c, generate_series(0, 9) k;
ANALYZE;`
