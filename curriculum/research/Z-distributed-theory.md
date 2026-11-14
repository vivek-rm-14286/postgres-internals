# Z — Distributed database theory (research notes for module E5)

Every fact below lists its source. Primary sources first; secondary summaries are marked **(secondary)**.

## Paxos — Lamport, "Paxos Made Simple" (2001)
Source: https://lamport.azurewebsites.net/pubs/paxos-simple.pdf (text extracted from the PDF)
- Roles: proposers, acceptors, learners. Non-Byzantine model.
- **Phase 1(a)**: proposer selects proposal number n, sends *prepare* n to a majority of acceptors.
- **Phase 1(b)**: if n is greater than any prepare the acceptor already responded to, it responds with a **promise not to
  accept any more proposals numbered less than n** and with the highest-numbered proposal (if any) it has accepted.
- **Phase 2(a)**: if the proposer receives responses from a majority, it sends an *accept* request (n, v) where v is the value
  of the highest-numbered proposal among the responses, or **any value if the responses reported no proposals**.
- **Phase 2(b)**: an acceptor accepts (n, v) unless it has already responded to a prepare with a number greater than n.
- Acceptor must remember (durably, across restarts) the highest-numbered proposal accepted and the highest prepare number
  it responded to.
- A value is **chosen** when a majority of acceptors has accepted it; any two majorities intersect (P2c invariant).
- **Progress (§2.4)**: two proposers can keep issuing increasing numbers so that none is chosen (duelling proposers: p
  phase 1 n1, q phase 1 n2>n1, p's accepts ignored, p phase 1 n3>n2, q's accepts ignored, …). To guarantee progress a
  **distinguished proposer** (leader) must be the only one issuing proposals. FLP implies leader election must use
  randomness or real time (timeouts). **Safety is ensured regardless of election success.**
- Multi-Paxos (§3): a leader runs phase 1 once for infinitely many instances; steady-state cost is phase 2 only.

## Raft — Ongaro & Ousterhout, "In Search of an Understandable Consensus Algorithm (Extended Version)", 2014
Source: https://raft.github.io/raft.pdf
- User study: 43 students at two universities; 33 answered Raft questions better than Paxos questions.
- Five properties (Figure 3): Election Safety (≤1 leader per term), Leader Append-Only, Log Matching, Leader Completeness,
  State Machine Safety.
- Terms act as a logical clock. Randomized election timeouts, e.g. **150–300 ms**.
- Election restriction: voter **denies its vote if its own log is more up-to-date** (compare last entry term, then length).
- §5.4.2: only entries from the leader's **current term** are committed by counting replicas; earlier entries commit
  indirectly. New leader commits a blank no-op at start of term.
- Read-only requests: leader exchanges heartbeats with a majority first; alternatively a **lease**, "but this would rely on
  timing for safety (it assumes bounded clock skew)".
- Timing requirement: broadcastTime ≪ electionTimeout ≪ MTBF.
- E3 already covers Raft mechanics (/e3/ha-clusters, /e3/distributed-sql-multimaster); E5 compares Paxos vs Raft only.

## Three-phase commit — Skeen, "Nonblocking Commit Protocols", SIGMOD 1981
Source: https://www.cs.purdue.edu/homes/bb/cs542-06Spr-bb/Nonblock-Skeen-81.pdf
- Network assumptions: (1) point-to-point communication always possible between operational sites ("the network never
  fails"); (2) the network detects a site failure (e.g. by timeout) and reliably reports it. → **site failures only, no
  partitions**.
- Fundamental nonblocking theorem / lemma (synchronous within one state transition): nonblocking iff (1) no local state
  adjacent to both a commit and an abort state, and (2) no noncommittable state adjacent to a commit state.
- 2PC's wait state w violates both. Fix: a **buffer state "prepare to commit" (p)** between w and c — committable state.
  This is the canonical nonblocking protocol, a **three-phase protocol**.
- "Committable" state: occupancy implies all sites voted yes.
- Cost: "an additional phase imposes a substantial overhead (in the number of messages)". Least modification of 2PC to be
  nonblocking. Two site failures are always necessary to block a transaction.
- Termination protocol runs at operational sites when the coordinator fails.

## Skeen & Stonebraker, "A Formal Model of Crash Recovery in a Distributed System", IEEE TSE SE-9(3), May 1983
Source: https://www.cs.purdue.edu/homes/bb/cs542-16Spr/TSE83_SS.pdf
- Theorem 3: no protocol using **independent recovery** is resilient to arbitrary failures by two sites.
- A protocol resilient to partitioning must be nonblocking (each isolated group must reach a consistent decision).
- **Theorem 4: there exists no protocol resilient to a network partitioning when messages are lost.** "Any time that a
  partitioning results in lost messages … a blocking protocol must be used. Unfortunately, this is the normal situation,
  especially for wide area networks. In the worst case only a single partition can continue processing."
- If sites cannot tell a site failure from a partition they must assume a partition. With only two sites, running anything
  more elaborate than 2PC is senseless unless failures can be differentiated.
- → why 3PC is rarely used: extra round trip per commit, and its nonblocking guarantee assumes a synchronous network with
  perfect failure detection; under partitions (timeout ≠ crash) 3PC can violate atomicity (one side commits from
  pre-commit, the other aborts from uncertain). Modern systems instead make the coordinator's decision fault-tolerant via
  consensus (Paxos/Raft replicated coordinator log; "Paxos Commit", Gray & Lamport 2006 — named only, not verified in depth).

## Consistent hashing — Karger et al., STOC 1997
Source: https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf
- Motivation: with a classical hash (e.g. x ↦ ax+b mod p) a change in the set of caches is "catastrophic" (nearly all
  items remap).
- Properties: **smoothness** (adding/removing a machine moves the *minimum* expected fraction of objects needed to stay
  balanced), **spread**, **load**, **balance**, **monotonicity** (items only move to the new bucket, never between old ones).
- Construction (§4.2): buckets and items mapped randomly to the unit interval; item goes to the "closest" bucket. Each
  bucket is **replicated κ·log(C) times** (multiple points per bucket) — the origin of virtual nodes.
- Math used in the visualizer (computed, not quoted): adding one node to n equal nodes ideally moves 1/(n+1) of keys;
  modulo-n → modulo-(n+1) moves a key unless h mod n = h mod (n+1), i.e. ≈ n/(n+1) of keys move.

## Dynamo — DeCandia et al., SOSP 2007
Source: https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
- Ring: hash output range is a fixed circular space; each node gets a random position; a key goes to the **first node
  clockwise** with a position larger than the key's. Departure/arrival affects only immediate neighbours.
- Two challenges of basic consistent hashing: random positions → **non-uniform data/load**; oblivious to **heterogeneous**
  nodes. Fix: **virtual nodes** ("tokens"): each node gets multiple ring positions.
- Advantages of vnodes: failed node's load dispersed evenly over remaining nodes; a new node takes roughly equal load from
  each other node; vnode count can follow capacity.
- Replication: N replicas on the N clockwise successors (skipping positions to get distinct physical nodes) =
  **preference list**. R + W > N gives a quorum-like system. **Sloppy quorum + hinted handoff** for temporary failures.
  **Merkle trees** for anti-entropy (one tree per key range/vnode). Gossip-based membership.
- Partitioning strategies (§6.2): Strategy 1 = T random tokens per node, partition by token (bootstrapping a node by
  scanning took "almost a day"; Merkle trees recomputed; partitioning and placement intertwined). Strategy 2 = T random
  tokens + Q equal-sized partitions. **Strategy 3 = Q/S tokens per node, Q equal-sized partitions** (fixed ranges,
  decoupled placement) — the paper's best load balance. → this is the "fixed hash ranges" alternative (Citus shard
  ranges, Cassandra vs Riak style).
- Failure detection: purely local view suffices ("node A may consider node B failed if node B does not respond to node
  A's messages (even if B is responsive to node C's messages)").

## Phi-accrual failure detector — Hayashibara, Défago, Yared, Katayama, SRDS 2004
Source: https://dspace02.jaist.ac.jp/dspace/bitstream/10119/4784/1/IS-RR-2004-010.pdf (JAIST research report IS-RR-2004-010)
- Accrual detector outputs a **suspicion level on a continuous scale**, not binary trust/suspect; applications pick
  thresholds (low threshold = quick detection, many wrong suspicions; high = fewer mistakes, slower).
- **φ(t_now) = −log10(P_later(t_now − T_last))**, P_later(t) = 1 − F(t), F = normal CDF with mean µ and variance σ²
  estimated from a sliding window (size WS) of heartbeat inter-arrival times (sum and sum of squares).
- Meaning: suspect when φ ≥ Φ; mistake likelihood ≈ 10% for Φ=1, 1% for Φ=2, 0.1% for Φ=3, …
- Experiments used window 1,000 samples.

## Distributed locking and fencing — Kleppmann, "How to do distributed locking" (8 Feb 2016)
Source: https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html
- A client holding a lease can pause (GC, page fault, network delay) past lease expiry, then write after another client
  acquired the lock → corruption. Checking the lease before writing does not help (pause can fall between check and write).
- **Fencing token**: a number that increases every time the lock is granted; storage server remembers the highest token
  and rejects older ones (client 1 token 33 paused; client 2 token 34 writes; client 1's write with 33 rejected).
- Redlock has no facility for generating fencing tokens; its safety depends on timing assumptions (bounded delay, pause,
  clock error). Use a consensus system (ZooKeeper zxid / znode version as token).
- Raft paper (above) agrees: leader leases rely on bounded clock skew.

## Timestamp ordering, Thomas write rule, certifiers — Bernstein, Hadzilacos, Goodman (1987), ch. 4
Source: https://www.microsoft.com/en-us/research/wp-content/uploads/2016/05/chapter4.pdf (book is free from MSR)
- **TO rule**: if p_i[x] and q_j[x] conflict, the DM processes p_i[x] before q_j[x] iff ts(T_i) < ts(T_j). Theorem 4.1: TO
  histories are serializable (SG edges follow timestamps, so no cycle). Equivalent serial order = timestamp order.
- **Basic TO**: outputs operations first-come-first-served; keeps **max-r-scheduled[x]** and **max-w-scheduled[x]**; rejects
  an operation that arrives "too late" (a conflicting op with a larger timestamp was already scheduled). Read r_i[x]
  conflicts with writes → reject if ts < max-w; write w_i[x] → reject if ts < max-r or ts < max-w. Rejected T aborts and
  is **resubmitted with a new, larger timestamp** (unlike wound-wait/wait-die, which keep the old timestamp).
- **Thomas' Write Rule**: if a write arrives too late only relative to a later *write* (ww), ignore it (don't send to the
  DM) but report success — writes in timestamp order produce the same result as the max-timestamp write alone. rw
  conflicts still need the read check (a late write with ts < max-r must still be rejected).
- **Certifiers** (§4.4) = optimistic schedulers: output operations immediately; at commit run a certification test and
  abort if the execution would be non-SR. Exist for 2PL, TO and SGT.

## Distributed deadlock detection — Bernstein & Goodman, "Concurrency Control in Distributed Database Systems", ACM CSUR 13(2) 1981
Source: https://dsf.berkeley.edu/cs286/papers/bernstein-csur1981.pdf
- Deadlock ⇔ cycle in the **waits-for graph**. Local waits-for graphs are **not sufficient** to characterise all distributed
  deadlocks (Figure 8: each site's graph acyclic, union cyclic). Must combine into a global graph.
- **Centralized** detection: one site is the detector; each scheduler periodically sends its local graph; detector takes
  the union. **Hierarchical**: detectors per region/country/continent.
- Problems: detection delay (periodic); **phantom deadlock** — a cycle including a transaction already restarted for
  another reason, so the detector may abort an unnecessary victim.
- Victim selection often by resources used. Timeouts as the alternative (BHG ch. 7 "Detecting Failures by Timeouts": the
  timeout period "is not a simple matter").
- Survey §4.2 also lists "The Thomas Write Rule" under T/O techniques.

## Özsu & Valduriez, Principles of Distributed Database Systems (3rd ed., 2011) — via course slides (secondary)
The book itself was not readable; facts come from slide decks that are modified versions of the authors' own slides.
- Ch.1 slides (D. Della Monica, Univ. Udine): https://users.dimi.uniud.it/~dario.dellamonica/teaching/23_24_2sem_ADBS/course_material/slides/2_distributed_database_architectures/2a_introduction_to_ddbs_ozsu_ch1.pdf
  - DDB = collection of multiple, logically interrelated databases distributed over a network; D-DBMS makes the
    distribution **transparent**. Not a DDBS: distributed files; a loosely coupled multiprocessor (= parallel DB); a
    centralized DB on a network node (= client/server).
  - **Transparency** = separation of higher-level semantics from lower-level implementation. Four types: data
    independence; **network/distribution transparency** (location + naming); **replication transparency**;
    **fragmentation transparency**. Also concurrency transparency and failure atomicity (ch.1/… "transactions"). Full
    transparency is a trade-off between ease of use and implementation cost.
  - Classification dimensions: **distribution** (non-distributed / client-server / fully distributed), **heterogeneity**
    (data model, query language, transaction management), **autonomy** (design, communication, execution; tight
    integration / semiautonomous / total isolation).
  - Architectures: client/server (DBMS on servers; clients UI + DBMS client, caching), peer-to-peer (classic = fully
    distributed DBMS), **multidatabase (MDBS) aka federated databases / data integration**: fully autonomous,
    independent, possibly heterogeneous DBMSs, each provides an **export schema**; a multidatabase layer gives users a
    view; built **bottom-up** (LCS → GCS) whereas a DDBS is designed **top-down**.
- 2001 slides (Purdue CS542): https://www.cs.purdue.edu/homes/bb/cs542-22Spr/slides/lecture/2_DDBMS.pdf — shared-memory
  (P1..Pn share M and D), shared-disk (each Pi own Mi, shared D), shared-nothing (each Pi own Mi and Di).
- Ch.3 distribution design: https://users.dimi.uniud.it/~dario.dellamonica/teaching/23_24_2sem_ADBS/course_material/slides/2_distributed_database_architectures/2b_Distribution_Design_ozsu_ch3_SPLIT.pdf
  - Correctness rules: **Completeness** (each data item of R is in some Ri); **Reconstruction** (exists operator ∇ with
    R = ∇ Ri: union for horizontal, join for vertical); **Disjointness** (item in Rj is in no other Rk). Vertical
    fragments repeat the **key**, so disjointness applies to non-key attributes.
  - PHF: fragments defined by **minterm predicates** (conjunctions of simple predicates or their negations); predicates
    must be complete and minimal; PHF completeness follows from exhaustive minterms; disjointness from mutual exclusion.
  - **DHF**: on a member relation of a link, propagated from owner: **Ri = R ⋉ Si**. Completeness and disjointness come
    from **foreign-key integrity** plus completeness/disjointness of the owner's PHF.
  - VF: F = { Π_{Pi ∪ key(R)} R }; reconstruction R = R1 ⋈ R2 ⋈ … ⋈ Rn; number of partitions of n attributes is Bell
    number B_n.
  - **Hybrid**: nest HF and VF (tree).
  - Allocation: **partitioned (non-replicated)**, **fully replicated**, **partially replicated**. Rule of thumb: if
    read-only queries / update queries ≥ 1, replication is advantageous, otherwise it may cause problems.
- Ch.7 localization: https://users.dimi.uniud.it/~dario.dellamonica/teaching/22_23_2sem_DMBD_ADBS4BD/course_material/slides/2_distributed_database_architectures/2d_Query_Localization_ozsu_ch7_SPLIT.pdf
  - Localization: algebra on global relations → algebra on fragments, using distribution info only (no statistics).
    Naïve: replace each global relation by its **localization program** (union of HF / join of VF). Then **reduction**:
    PHF selection — drop fragments whose predicate contradicts the selection; PHF join — distribute join over unions and
    drop joins of fragments with contradicting predicates; VF projection — drop fragments sharing only the key with the
    projection; DHF join — joins collapse to Ri ⋈ Si pairs.
- Ch.8 optimization: https://users.dimi.uniud.it/~dario.dellamonica/teaching/22_23_2sem_DMBD_ADBS4BD/course_material/slides/2_distributed_database_architectures/2e_Query_Optimization_ozsu_ch8_SPLIT.pdf
  - Cost = I/O + CPU + communication; early approaches counted only communication.
  - Semijoin program: R ⋈ S = (R ⋉ S) ⋈ S. Ship Π_A(S) to R's site, ship back R ⋉ S. **Semijoin better iff
    size(Π_A(S)) + size(R ⋉ S) < size(R)**. Good with high selectivity and/or wide R tuples; bad otherwise; loses
    indexes; Π_A(S) can be shrunk to a **bit array** (hash filter; over-approximation; = Bloom-filter join).
  - Full reducers: none for cyclic queries; NP-hard in general.
  - Join site choice + transfer method: **ship-whole** vs **fetch-as-needed**; four strategies with LT/CT cost formulas.

## Shared-nothing
- Stonebraker, "The Case for Shared Nothing", IEEE Database Engineering Bulletin 9(1), 1986 — citation verified via
  secondary sources only (https://en.wikipedia.org/wiki/Shared-nothing_architecture); paper not read. Visible text uses
  only the architecture definitions from the Özsu slides above.

## Vendor docs (current)
- **Citus distributed deadlock detection**
  - https://docs.citusdata.com/en/stable/develop/api_guc.html — `citus.distributed_deadlock_detection_factor`: time to
    wait before checking = factor × `deadlock_timeout`; default **2**; **-1 disables**. `citus.node_conninfo` sslmode
    defaults to **require** as of Citus 8.1; example `sslrootcert=… sslmode=verify-full`. `citus.local_hostname` (default
    localhost) for verify-full self connections.
  - https://www.citusdata.com/blog/2017/08/31/databases-and-distributed-deadlocks-a-faq — example: worker A s2 waits s1,
    worker B s1 waits s2; "Neither PostgreSQL database on worker A or worker B sees a problem."
  - Source code https://raw.githubusercontent.com/citusdata/citus/main/src/backend/distributed/transaction/distributed_deadlock_detection.c
    — builds global wait graph from local + remote wait edges, DFS for a cycle, **"the youngest participant backend is
    cancelled"** (comment: a 1-hour DDL vs 10 ms SELECT → cancel the SELECT). Runs in the maintenance daemon.
- **Cassandra** https://cassandra.apache.org/doc/latest/cassandra/architecture/overview.html — "a partitioned
  **wide-column** storage model with eventually consistent semantics"; combines Dynamo's distribution/replication with
  Bigtable's data/storage model. cassandra.yaml https://cassandra.apache.org/doc/latest/cassandra/managing/configuration/cass_yaml_file.html
  — `num_tokens` default **16** (vnodes); `allocate_tokens_for_local_replication_factor` 3; **`phi_convict_threshold`
  default 8** ("phi value that must be reached for a host to be marked down"); `server_encryption_options.
  internode_encryption` none | dc | rack | all (default none); `internode_authenticator` e.g. MutualTlsInternodeAuthenticator.
- **DynamoDB** https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html — "supports both
  **key-value and document** data models"; no JOIN operator; strong read consistency option and ACID transactions;
  global tables are multi-active; replicates across three AZs.
- **MongoDB** https://www.mongodb.com/docs/manual/core/document/ — stores records as **BSON documents** (field/value
  pairs, embedded documents and arrays); max document size **16 MiB**.
- **Neo4j** https://neo4j.com/docs/getting-started/graph-database/ — **graph** database: nodes, relationships (typed,
  directed), properties, labels; relationships stored natively alongside nodes (no JOINs).
- **CockroachDB** https://docs.cockroachlabs.com/docs/stable/table-localities — REGIONAL BY TABLE (default; one home
  region), **REGIONAL BY ROW** (hidden `crdb_region` column, defaults to gateway region; table+indexes partitioned by
  it), GLOBAL (fast reads everywhere, slower writes, non-blocking transactions with future timestamps). Survival goals
  ZONE / REGION.
- **YugabyteDB** https://docs.yugabyte.com/stable/explore/multi-region-deployments/row-level-geo-partitioning/ — row-level
  geo-partitioning = `PARTITION BY LIST (geo_partition)` + each partition in a **tablespace** whose `replica_placement`
  JSON pins replicas to cloud/region/zone; used for data residency (GDPR).

## PostgreSQL 18.7 docs (local copies: sources/postgresql-18.7-docs/)
- runtime-config-connection: `ssl_min_protocol_version` valid TLSv1, TLSv1.1, TLSv1.2, TLSv1.3; **default TLSv1.2**;
  SSLv2/v3 always disabled; postgresql.conf / command line only.
- auth-pg-hba-conf: `hostssl` matches TCP/IP only with SSL; `hostnossl` the opposite. `clientcert=verify-ca|verify-full`
  on any hostssl record (verify-full also matches the cert CN to the user name). `cert` auth method.
- view-pg-hba-file-rules: one row per non-empty, non-comment line; `rule_number` = order considered until a match;
  superuser-only by default.
- libpq-ssl: `sslmode=verify-ca` checks chain; `verify-full` also checks host name (SAN, else CN); verify-full
  recommended in security-sensitive environments; `require` without root CA does not authenticate the server.
- postgres-fdw: remote query optimization sends WHERE clauses (built-in or listed-extension, IMMUTABLE), fetches only
  needed columns, sends whole joins between foreign tables on the same server; `EXPLAIN VERBOSE` shows the remote SQL;
  `use_remote_estimate`, `fdw_tuple_cost` default **0.2** (per-tuple transfer overhead), `extensions` option.
- ddl-partitioning §5.12.4: partition pruning — planner proves a partition cannot contain matching rows and excludes it;
  `enable_partition_pruning` default on; also runtime pruning at executor init/execution.
- runtime-config-query: `enable_partitionwise_join` (default off; requires join on all partition keys, same types,
  one-to-one matching partitions) and `enable_partitionwise_aggregate` (default off; partial aggregation per partition
  if GROUP BY lacks the partition key).
- `satisfies_hash_partition(oid, modulus, remainder, value)` is the internal function behind hash partition
  constraints (fixed in 18.6 release notes for VARIADIC NULL).

## Query decomposition steps (secondary)
- Özsu & Valduriez ch.7 (via search summary of the Springer chapter excerpt
  https://springerlink.bibliotecabuap.elogim.com/content/pdf/10.1007/978-1-4419-8834-8_7.pdf and Özsu's Waterloo CS448
  notes https://cs.uwaterloo.ca/~tozsu/courses/cs448/notes/7.QueryProcessing.pdf): **normalization** (conjunctive /
  disjunctive normal form), **analysis** (reject type-incorrect or semantically incorrect queries, e.g. disconnected
  query graph), **elimination of redundancy** (idempotency rules, p1 ∧ (p1 ∨ p2) = p1), **rewriting** (calculus →
  algebra operator tree, then restructuring). Decomposition does not use distribution info; localization does.

## Verified in the in-browser PostgreSQL 18.6 (Node probe, Nov 2026)
- `erf()`/`erfc()` exist (new in PG 18): erf(1)=0.8427007929497149.
- `pg_hba_file_rules` readable; `ssl`=off, `ssl_min_protocol_version`=TLSv1.2, `password_encryption`=scram-sha-256,
  `deadlock_timeout`=1000 ms.
- CREATE FOREIGN DATA WRAPPER (no handler) / SERVER / USER MAPPING / FOREIGN TABLE work; scanning fails with
  `foreign-data wrapper "dummy_fdw" has no handler` (real PG behaviour for a handler-less wrapper).
- `hashint4(42)` = 1509752520; `satisfies_hash_partition` works; advisory locks visible in pg_locks.

## Citus 2PC recovery (source code)
- https://raw.githubusercontent.com/citusdata/citus/main/src/backend/distributed/transaction/transaction_recovery.c —
  `recover_prepared_transactions()` "recovers any pending prepared transactions started by this node on other nodes";
  `LogTransactionRecord` writes a row in **pg_dist_transaction** when a transaction is prepared on a worker: "The presence
  of this record indicates that the prepared transaction should be committed."
- https://raw.githubusercontent.com/citusdata/citus/main/src/backend/distributed/utils/maintenanced.c — maintenance daemon
  runs 2PC recovery on primaries every `Recover2PCInterval` = **60000 ms** by default (GUC citus.recover_2pc_interval).
- auth-pg-hba-conf: "The first record with a matching connection type, client address, requested database, and user name
  is used to perform authentication. There is no fall-through or backup: if one record is chosen and the authentication
  fails, subsequent records are not considered. If no record matches, access is denied." Database keyword
  `replication` matches physical replication connections.
- auth-cert: `cert` method only for SSL connections; requires a valid, trusted client cert; CN compared to the database
  user name (or a map); `cert` is effectively trust with clientcert=verify-full.
- PG 18 has `random_normal(mean, stddev)` (since 16) and `erf`/`erfc` (new in 18).
