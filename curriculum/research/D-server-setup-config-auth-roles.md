# Slice D — Part III ch.16-23: Installation, Server Setup and Operation, Server Configuration, Client Authentication, Database Roles, Managing Databases, Localization

Source: PostgreSQL 18.7 docs, `_order.tsv` idx 171-247 (77 pages). Module tags: M1..M7 as in `_BRIEF.md`.

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 171 | admin.txt | Part III intro + TOC (ch.16-31); chapters self-contained, narrative order for a new admin. |
| 172 | install-binaries.txt | Binary packages are the recommended install; source builds only for PG/extension developers. |
| 173 | installation.txt | Ch.17 TOC (requirements, getting source, autoconf/make, meson, post-install, platforms, platform notes). |
| 174 | install-requirements.txt | Build prerequisites and minimum versions (GNU make 3.81, Meson 0.54, C99, Bison 2.3, Perl 5.14, ICU 4.2, OpenSSL 1.1.1, Python 3.6.8, Tcl 8.4, zstd 1.4.0 ...). |
| 175 | install-getsource.txt | Tarball `postgresql-version.tar.gz/.bz2` from postgresql.org/ftp/source or Git. |
| 176 | install-make.txt | configure/make procedure, every configure option (locations, features, anti-features, blocksize/segsize/wal-blocksize, developer options), env vars, COPT/PROFILE. |
| 177 | install-meson.txt | meson setup/ninja procedure, every -D option, build/doc/install targets. |
| 178 | install-post.txt | LD_LIBRARY_PATH / ldconfig, PATH, MANPATH, PGHOST/PGPORT. |
| 179 | supported-platforms.txt | Supported CPU architectures and OSes; build farm defines "supported". |
| 180 | installation-platform-notes.txt | Cygwin, macOS (sysroot, SIP), MinGW, Solaris, Visual Studio notes; `crashdumps` dir for Windows minidumps. |
| 181 | runtime.txt | Ch.18 TOC. |
| 182 | postgres-user.txt | Run server under a dedicated unprivileged OS account (`postgres`) that does not own the executables. |
| 183 | creating-cluster.txt | initdb, data directory, postgres/template1/template0, permissions 0700/0600 (0750/0640 with group access), locale/encoding fixed at init, secondary FS and NFS rules. |
| 184 | server-start.txt | `postgres -D`, `pg_ctl start -l`, boot scripts, systemd unit (Type=notify), postmaster.pid, startup failure messages, client connection problems. |
| 185 | kernel-resources.txt | SysV/POSIX shared memory & semaphores (Table 18.1), per-OS sysctls, systemd RemoveIPC, ulimits, Linux overcommit/OOM killer, huge pages. |
| 186 | server-shutdown.txt | Smart (SIGTERM), Fast (SIGINT), Immediate (SIGQUIT) shutdown; never SIGKILL; pg_terminate_backend. |
| 187 | upgrading.txt | Version numbering, minor vs major upgrades; pg_dumpall, pg_upgrade, logical-replication upgrade paths. |
| 188 | preventing-server-spoofing.txt | Spoofing while server is down; secured socket dir, requirepeer, SSL verify-ca/verify-full, channel_binding=require, gssencmode=require. |
| 189 | encryption-options.txt | Password hashing, pgcrypto column encryption, disk encryption, SSL/GSSAPI network encryption, SSL host auth, client-side encryption. |
| 190 | ssl-tcp.txt | ssl=on, server.crt/server.key rules (0600 / root 0640), client certs (clientcert=verify-ca/verify-full), Table 18.2, openssl certificate recipes. |
| 191 | gssapi-enc.txt | GSSAPI encryption negotiated on same port; client-chosen unless hostgssenc used. |
| 192 | ssh-tunnels.txt | `ssh -L 63333:localhost:5432 joe@foo.com` tunnel semantics. |
| 193 | event-log-registration.txt | `regsvr32 pgevent.dll` to register Windows event source (default `PostgreSQL`). |
| 194 | runtime-config.txt | Ch.19 TOC. |
| 195 | config-setting.txt | GUC value types & units, postgresql.conf syntax, SIGHUP reload, postgresql.auto.conf/ALTER SYSTEM, ALTER DATABASE/ROLE SET, SET/SHOW, pg_settings, -c / PGOPTIONS, include directives. |
| 196 | runtime-config-file-locations.txt | data_directory, config_file, hba_file, ident_file, external_pid_file. |
| 197 | runtime-config-connection.txt | Connection settings (listen_addresses, port, max_connections, reserved slots, unix sockets), TCP keepalives, authentication GUCs, all ssl_* GUCs. |
| 198 | runtime-config-resource.txt | Memory (shared_buffers, work_mem, SLRU buffers...), disk, kernel, bgwriter, I/O (AIO: io_method, io_workers), worker processes/parallelism. |
| 199 | runtime-config-wal.txt | wal_level, fsync, synchronous_commit (Table 19.1), wal_sync_method, full_page_writes, wal_buffers, WAL writer, group commit, checkpoints, archiving, recovery/prefetch, standby.signal/recovery.signal, recovery targets, WAL summarization. |
| 200 | runtime-config-replication.txt | Sending-server (max_wal_senders, slots, output_plugin_libraries, wal_keep_size), primary (synchronous_standby_names FIRST/ANY), standby (hot_standby, delays, feedback), subscriber worker GUCs. |
| 201 | runtime-config-query.txt | All enable_* planner method flags, planner cost constants, JIT cost thresholds, GEQO settings, default_statistics_target, constraint_exclusion, collapse limits, plan_cache_mode, recursive_worktable_factor. |
| 202 | runtime-config-logging.txt | Where/when/what to log: log_destination, logging collector & rotation, syslog, severity levels (Table 19.3), log_connections options, log_line_prefix escapes, csvlog columns, jsonlog keys, cluster_name/process title. |
| 203 | runtime-config-statistics.txt | track_* cumulative statistics GUCs, stats_fetch_consistency, compute_query_id, log_*_stats. |
| 204 | runtime-config-vacuum.txt | Autovacuum triggers/thresholds/scale factors, cost-based delay model and formula, vacuum_truncate, freezing ages, failsafe, eager-freeze failure rate. |
| 205 | runtime-config-client.txt | Statement behaviour (search_path, timeouts, default_transaction_*), locale/formatting, library preloading, dynamic_library_path, extension_control_path. |
| 206 | runtime-config-locks.txt | deadlock_timeout, max_locks_per_transaction, predicate-lock table sizing and promotion thresholds. |
| 207 | runtime-config-compatible.txt | Legacy-behaviour switches (array_nulls, backslash_quote, standard_conforming_strings, synchronize_seqscans, transform_null_equals) and allow_alter_system. |
| 208 | runtime-config-error-handling.txt | exit_on_error, restart_after_crash, data_sync_retry (PANIC on fsync failure), recovery_init_sync_method. |
| 209 | runtime-config-preset.txt | Read-only preset parameters: block_size, segment_size, wal_segment_size, max_identifier_length, shared_memory_size, huge_pages_status, etc. |
| 210 | runtime-config-custom.txt | Two-part custom option names (ext.param) and placeholder semantics. |
| 211 | runtime-config-developer.txt | Developer/recovery options: allow_system_table_mods, debug_* switches, trace_* (LOCK_DEBUG), wal_consistency_checking, zero_damaged_pages, ignore_checksum_failure, jit_* debug flags, send_abort_for_*. |
| 212 | runtime-config-short.txt | Table 19.6 single-letter postgres switches (-B, -d, -F, -N, -S, -f*, ...). |
| 213 | client-authentication.txt | Ch.20 intro: authentication = establishing client identity; "database user" = role with LOGIN; DB user names separate from OS users. |
| 214 | auth-pg-hba-conf.txt | pg_hba.conf record formats, connection types, database/user/address matching rules, auth-method list, clientcert/clientname, include directives, Example 20.1. |
| 215 | auth-username-maps.txt | pg_ident.conf maps (map-name system-username database-username), regex with \1 capture, `all`, `+role`, pg_ident_file_mappings, Example 20.2. |
| 216 | auth-methods.txt | List of the 12 authentication method families; peer recommended locally, password for remote. |
| 217 | auth-trust.txt | trust semantics and when it is acceptable (socket permissions); remove host 127.0.0.1 trust line. |
| 218 | auth-password.txt | scram-sha-256 (RFC 7677), md5 (auto-upgrades to SCRAM if stored hash is SCRAM), password (cleartext); storage in pg_authid; MD5->SCRAM migration. |
| 219 | gssapi-auth.txt | GSSAPI/Kerberos principals servicename/hostname@realm, keytab, include_realm, map, krb_realm. |
| 220 | sspi-auth.txt | Windows SSPI negotiate (Kerberos then NTLM): include_realm, compat_realm, upn_username, map, krb_realm. |
| 221 | auth-ident.txt | RFC 1413 ident on TCP port 113; only for tightly controlled networks; local ident => peer. |
| 222 | auth-peer.txt | Kernel-provided client OS user (getpeereid/SO_PEERCRED); local only; map option. |
| 223 | auth-ldap.txt | LDAP simple bind vs search+bind; all ldap* options, ldapurl format, DNS SRV discovery, examples. |
| 224 | auth-radius.txt | RADIUS Access Request (Authenticate Only), radiusservers/secrets/ports(1812)/identifiers. |
| 225 | auth-cert.txt | cert method: client certificate CN vs user name; = trust + clientcert=verify-full. |
| 226 | auth-pam.txt | PAM (service `postgresql`), pamservice, pam_use_hostname; /etc/shadow caveat. |
| 227 | auth-bsd.txt | OpenBSD BSD Authentication (auth-postgresql login type, `auth` group). |
| 228 | auth-oauth.txt | OAuth 2.0 bearer tokens (new in 18): roles in the ecosystem, issuer/scope/validator/map/delegate_ident_mapping. |
| 229 | client-authentication-problems.txt | The four standard FATAL messages and their meaning. |
| 230 | user-manag.txt | Ch.21 intro: roles subsume users and groups (since 8.1); roles own objects and hold privileges. |
| 231 | database-roles.txt | CREATE/DROP ROLE, createuser/dropuser, pg_roles, \du; bootstrap superuser named after initdb OS user; roles are cluster-global. |
| 232 | role-attributes.txt | LOGIN, SUPERUSER, CREATEDB, CREATEROLE (and its limits), REPLICATION, PASSWORD, INHERIT, BYPASSRLS, CONNECTION LIMIT; ALTER ROLE SET; automatic ADMIN grant-back for CREATEROLE. |
| 233 | role-membership.txt | Group roles, GRANT/REVOKE membership, SET vs INHERIT options, joe/admin/wheel/island example, attributes never inherited. |
| 234 | role-removal.txt | REASSIGN OWNED + DROP OWNED per database, then DROP ROLE. |
| 235 | predefined-roles.txt | All predefined roles (pg_checkpoint ... pg_use_reserved_connections) and their capabilities. |
| 236 | perm-functions.txt | Trojan-horse risk of functions/triggers/RLS; untrusted languages superuser-only. |
| 237 | managing-databases.txt | Ch.22 intro: databases are the topmost level for organizing SQL objects. |
| 238 | manage-ag-overview.txt | Hierarchy cluster > database > schema > object; cluster-level objects in pg_global; one database per connection; shared WAL caveat; pg_database, \l. |
| 239 | manage-ag-createdb.txt | CREATE DATABASE / createdb, owner, postgres first database, template1 cloned by default, OWNER clause. |
| 240 | manage-ag-templatedbs.txt | template1 vs template0, no copy of database-level GRANTs, encoding/locale only changeable from template0, datistemplate/datallowconn, no other sessions on source. |
| 241 | manage-ag-config.txt | ALTER DATABASE ... SET/RESET per-database GUC defaults. |
| 242 | manage-ag-dropdb.txt | DROP DATABASE / dropdb; owner or superuser; cannot be connected to the victim. |
| 243 | manage-ag-tablespaces.txt | CREATE TABLESPACE, pg_default/pg_global, default_tablespace/temp_tablespaces, pg_tblspc symlinks, tablespaces not autonomous. |
| 244 | charset.txt | Ch.23 intro: OS locale features (23.1, 23.2) and character sets with client/server translation (23.3). |
| 245 | locale.txt | Locale categories (LC_COLLATE...LC_TIME), C/POSIX, fixed LC_COLLATE/LC_CTYPE per database, env variable precedence, affected SQL features, selection scopes, providers builtin/icu/libc, ICU language tags and canonicalization. |
| 246 | collation.txt | Collation derivation rules (explicit/implicit/indeterminate), standard collations (unicode, ucs_basic, pg_unicode_fast, pg_c_utf8, C/POSIX, default), pg_collation, libc vs ICU naming, nondeterministic collations, ICU levels (Table 23.1), settings (Table 23.2), tailoring rules. |
| 247 | multibyte.txt | Character sets (Table 23.3), SQL_ASCII semantics, initdb -E / CREATE DATABASE ENCODING, client encoding selection, client/server conversion matrix (Table 23.4) and all built-in conversions (Table 23.5). |

## Notes by topic

### Installation from binaries / source: what matters for internals  [M1, M2]  (source: install-binaries.txt, installation.txt, install-requirements.txt, install-getsource.txt, install-make.txt, install-meson.txt, install-post.txt, supported-platforms.txt, installation-platform-notes.txt)

- Binary packages are the recommended way to install; building from source "is only recommended for people developing PostgreSQL or extensions".
- Build requirements (exact minimums): GNU make >= 3.81 (or Meson >= 0.54; Meson is the only option on Windows/Visual Studio, "experimental" on other platforms); ISO/ANSI C compiler at least C99; tar + gzip or bzip2; Flex and Bison (Bison >= 2.3; other lex/yacc cannot be used); Perl >= 5.14 (build + some tests); GNU Readline (default; libedit alternative; `--without-readline`); zlib (default; `--without-zlib` disables compressed archives in pg_dump/pg_restore); ICU (default; ICU4C >= 4.2, pkg-config supported for >= 4.6; `--without-icu`).
- Optional: PL/Perl (shared libperl, Perl >= 5.14, `usemultiplicity` recommended); PL/Python (Python >= 3.6.8, shared libpython, sysconfig module); PL/Tcl (Tcl >= 8.4); NLS (Gettext API); OpenSSL >= 1.1.1 (also needed for random numbers where /dev/urandom is absent, except Windows) or LibreSSL >= 3.4 (OpenBSD 7.0); MIT Kerberos (GSSAPI), OpenLDAP, PAM; Curl (OAuth Device Authorization flow client module; libcurl >= 7.61.0); LZ4 (`default_toast_compression`, `wal_compression`); Zstandard >= 1.4.0 (`wal_compression`); LLVM >= 14 for JIT (`--with-llvm`, needs clang + C++ compiler); libxml2 >= 2.6.23 (SQL/XML); libxslt (xml2 module); liburing (io_uring async I/O, `--with-liburing`); libnuma (`--with-libnuma`, basic NUMA support); systemd (`--with-systemd`, service notifications); SELinux (sepgsql); Bonjour; uuid-ossp via `--with-uuid=bsd|e2fs|ossp`.
- Short version (make): `./configure; make; su; make install; adduser postgres; mkdir -p /usr/local/pgsql/data; chown postgres /usr/local/pgsql/data; su - postgres; /usr/local/pgsql/bin/initdb -D /usr/local/pgsql/data; /usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data -l logfile start; /usr/local/pgsql/bin/createdb test; /usr/local/pgsql/bin/psql test`. Meson: `meson setup build --prefix=/usr/local/pgsql; cd build; ninja; ninja install` then same.
- Default install prefix `/usr/local/pgsql`. "/postgresql" is auto-appended to datadir, sysconfdir, docdir unless the expanded name already contains "postgres" or "pgsql".
- make targets: `make`/`make all`; `make world` (incl. docs + contrib); `make world-bin` (contrib, no docs); `make check` (regression tests, not as root); `make install`, `install-docs`, `install-world`, `install-world-bin`, `install-strip`; `make uninstall`; `make clean`; `make distclean`. Client-only install: `make -C src/bin install; make -C src/include install; make -C src/interfaces install; make -C doc install`. VPATH build = configure run from a separate build dir. Calling from another makefile requires `MAKELEVEL=0`.
- **Compile-time storage constants (feed M2):**
  - `--with-blocksize=BLOCKSIZE` (meson `-Dblocksize`): table block size in kB, default **8**, must be a power of 2 between **1 and 32**. Changing breaks on-disk compatibility (no pg_upgrade across).
  - `--with-wal-blocksize=BLOCKSIZE` (`-Dwal_blocksize`): WAL block size in kB, default **8**, power of 2 between **1 and 64**. Breaks on-disk compatibility.
  - `--with-segsize=SEGSIZE` (`-Dsegsize`): relation segment size in GB, default **1 GB** ("Large tables are divided into multiple operating-system files, each of size equal to the segment size"); larger reduces file descriptors; recommended power of 2; breaks on-disk compatibility. `--with-segsize-blocks` (`-Dsegsize_blocks`): developer-only, segment size in blocks, wins if both given.
  - `--with-pgport=NUMBER` default **5432**. `--with-krb-srvnam` default `postgres` (upper-case `POSTGRES` on Windows).
- Developer options: `--enable-debug` (symbols; recommended in production only with GCC), `--enable-cassert` (assertion checks; slows server; an assertion failure causes server restart; not for production), `--enable-tap-tests` (Perl IPC::Run), `--enable-depend`, `--enable-coverage`, `--enable-profiling` (gmon.out per backend exit), `--enable-dtrace` (DTRACE, DTRACEFLAGS), `--enable-injection-points` (run user-defined code at pre-defined code paths; testing only). Meson equivalents: `--buildtype` (default `debugoptimized`; plain/debug/debugoptimized/release), `--debug`, `--optimization={0,g,1,2,3,s}`, `--werror`, `-Dcassert`, `-Dtap_tests`, `-DPG_TEST_EXTRA`, `-Db_coverage`, `-Ddtrace`, `-Dinjection_points`.
- Other configure options: `--prefix`, `--exec-prefix`, `--bindir`, `--sysconfdir`, `--libdir`, `--includedir`, `--datarootdir`, `--datadir`, `--localedir`, `--mandir`, `--docdir`, `--htmldir`, `--enable-nls[=LANGUAGES]`, `--with-perl`, `--with-python`, `--with-tcl`, `--with-tclconfig`, `--with-llvm`, `--with-lz4`, `--with-zstd`, `--with-ssl=openssl` (`--with-openssl` obsolete), `--with-gssapi`, `--with-ldap`, `--with-pam`, `--with-bsd-auth` (OpenBSD only), `--with-systemd`, `--with-bonjour`, `--with-uuid`, `--with-ossp-uuid` (obsolete), `--with-libcurl`, `--with-libnuma`, `--with-liburing`, `--with-libxml`, `--with-libxslt`, `--with-selinux`, `--without-icu`, `--without-readline`, `--with-libedit-preferred`, `--without-zlib`, `--with-includes`, `--with-libraries`, `--with-system-tzdata=DIR` (use OS IANA tz database instead of bundled), `--with-extra-version`, `--disable-rpath`.
- configure env vars: BISON, CC, CFLAGS, CLANG, CPP, CPPFLAGS, CXX, CXXFLAGS, DTRACE, DTRACEFLAGS, FLEX, LDFLAGS, LDFLAGS_EX, LDFLAGS_SL, LLVM_CONFIG, MSGFMT, PERL, PYTHON (probes `python3 python`), TCLSH, XML2_CONFIG. `COPT` / `PROFILE` add flags at make time (e.g. `make COPT='-Werror'`, `make PROFILE=-O0 file.o`); `-Werror` cannot go in CFLAGS at configure time. Build with at least `-O1` under GCC (`-O0` disables some warnings).
- Meson specifics: features default `auto` (enabled if dependency found) and can be forced `enabled`/`disabled`; `--auto-features`; `-Dllvm` is disabled by default; `-Duuid` default `none`; `-Dssl={auto|openssl}`; `--backend=ninja|vs`; `-Dc_args`, `-Dc_link_args`, `-Dextra_include_dirs`, `-Dextra_lib_dirs` (comma-separated), `-Dsystem_tzdata`, `-Dextra_version`, `-Drpath` (default true), `-DBINARY_NAME=PATH`, `-Ddocs`, `-Ddocs_pdf`, `-Ddocs_html_style={simple|website}`, `-Dpgport`, `-Dkrb_srvnam`. Targets: `all`, `backend`, `bin`, `contrib`, `pl`, `reformat-dat-files`, `expand-dat-files`, `update-unicode`, `html`, `man`, `docs`, `doc/src/sgml/postgres-A4.pdf`, `postgres-US.pdf`, `postgres.html`, `alldocs`, `install`, `install-docs`, `install-html`, `install-man`, `install-quiet`, `install-world`, `uninstall`, `clean`, `test`, `world`, `help`. `meson test --setup running` runs pg_regress/isolation tests against a running instance.
- Post-install: shared library path via `LD_LIBRARY_PATH=/usr/local/pgsql/lib` (not needed on FreeBSD, Linux, NetBSD, OpenBSD, Solaris); Linux `/sbin/ldconfig /usr/local/pgsql/lib`; BSD `/sbin/ldconfig -m ...`; add `/usr/local/pgsql/bin` to PATH; MANPATH; `PGHOST`/`PGPORT` override compiled-in client defaults.
- Supported CPU architectures: x86, PowerPC, S/390, SPARC, ARM, MIPS, RISC-V (big/little endian, 32/64-bit). OSes: Linux, Windows, FreeBSD, OpenBSD, NetBSD, DragonFlyBSD, macOS, Solaris, illumos. "Supported" = code has provisions and Build Farm recently verified build + regression tests.
- Platform notes: Cygwin (server no longer recommended; needs `cygserver` for shared memory; OpenSSL not supported; `make MAX_CONNECTIONS=5 check`). macOS: `xcode-select --install`; `PG_SYSROOT`; SIP breaks `make check` (workaround: `make install` first). Windows: native port needs Windows 10+; built with Meson + Visual Studio 2015-2022 / Windows SDK 10; only x64 on 64-bit; native psql lacks line editing; **creating a `crashdumps` subdirectory in the data directory enables minidump generation on crash**. Solaris: Sun compiler recommended on SPARC (`-xO5`, avoid `-fast`); DTrace needs Solaris 10u4+.

### The PostgreSQL OS user and creating a cluster (initdb)  [M1, M2]  (source: postgres-user.txt, creating-cluster.txt)

- Run the server under a separate OS user (conventionally `postgres`) that owns only the server's data, is not shared with other daemons (not `nobody`), and should NOT own the PostgreSQL executables (so a compromised server process cannot modify them).
- **Database cluster** (SQL standard: *catalog cluster*) = "a collection of databases that is managed by a single instance of a running database server". In file-system terms it is one directory: the **data directory / data area** (no default location; `/usr/local/pgsql/data`, `/var/lib/pgsql/data` popular). `PGDATA` env var is the alternative to `-D`.
- After `initdb` a cluster contains three databases: `postgres` (default database for utilities/users/third-party apps; server itself does not need it), `template1`, `template0` (templates; not for real work).
- Create: `initdb -D /usr/local/pgsql/data` or `pg_ctl -D /usr/local/pgsql/data initdb`, as the PostgreSQL OS user. initdb creates the directory if missing; refuses to run if the directory exists and already contains files.
- Permissions: initdb revokes access from everyone but the PostgreSQL user (and optionally group; group access is read-only, intended for backups by an unprivileged user in the group). Modes: owner-only cluster = **0700 dirs / 0600 files**; group-readable = **0750 dirs / 0640 files**. Changing group access on an existing cluster requires shutdown and chmod of all files/dirs.
- Security caveat: default client authentication after initdb lets any local user connect and even become superuser (trust). Fix: `initdb -W` / `--pwprompt` / `--pwfile` to set superuser password, plus `-A scram-sha-256`; or edit pg_hba.conf before first start; or use peer auth / filesystem permissions.
- initdb fixes the default locale (from the environment unless overridden) and the default character-set encoding. Sort order of the template databases cannot be changed without dropping/recreating them; non-C/POSIX locales have a performance impact.
- Non-C/non-POSIX locales rely on the OS collation library, which controls ordering of keys in indexes: "a cluster cannot switch to an incompatible collation library version, either through snapshot restore, binary streaming replication, a different operating system, or an operating system upgrade."
- Secondary file systems: do not use a mount point itself as the data directory; create a postgres-owned directory inside the mount point and put the data directory inside it (avoids permission problems, e.g. with pg_upgrade, and gives clean failures if the volume is offline).
- File systems: any POSIX-semantics FS works; no major performance differences expected from switching FS.
- NFS: PostgreSQL does nothing special (assumes local-disk behaviour; uses no file locking). Only firm requirement: mount with **`hard`** option (`soft` interrupts syscalls -> I/O errors, PostgreSQL does not retry). `sync` mount option not needed (`async` suffices because PostgreSQL issues fsync), but the **`sync` export option on the NFS server** is strongly recommended, otherwise fsync is not guaranteed to reach stable storage (corruption similar to `fsync=off`).

### Starting the server  [M1]  (source: server-start.txt)

- The database server program is called `postgres`. Foreground start: `postgres -D /usr/local/pgsql/data` (as the PostgreSQL OS user; without `-D` uses `PGDATA`, else fails). Background: `postgres -D ... >logfile 2>&1 &`. Wrapper: `pg_ctl start -l logfile` (and `pg_ctl stop`).
- Must never run as root: boot scripts use `su postgres -c 'pg_ctl start -D /usr/local/pgsql/data -l serverlog'`. Example start scripts in `contrib/start-scripts` (freebsd, linux).
- systemd unit: `Type=notify` (requires build `--with-systemd`), `User=postgres`, `ExecStart=/usr/local/pgsql/bin/postgres -D /usr/local/pgsql/data`, `ExecReload=/bin/kill -HUP $MAINPID`, `KillMode=mixed`, `KillSignal=SIGINT`, `TimeoutSec=infinity` (systemd default timeout is 90 s and would kill a server still doing crash recovery).
- While running, the postmaster PID is stored in `postmaster.pid` in the data directory: prevents multiple instances on the same data directory; usable for shutting down.
- Startup failure messages and meaning:
  - `LOG: could not bind IPv4 address "127.0.0.1": Address already in use` / `FATAL: could not create any TCP/IP sockets` -> another server on the same port. `Permission denied` variant -> reserved port (e.g. `postgres -p 666`).
  - `FATAL: could not create shared memory segment: Invalid argument` / `DETAIL: Failed system call was shmget(key=5440001, size=4011376640, 03600)` -> kernel SysV shared memory limit too small; only likely with `shared_memory_type = sysv`; reduce `shared_buffers` or raise kernel limit.
  - `FATAL: could not create semaphores: No space left on device` / `DETAIL: Failed system call was semget(5440126, 17, 03600)` -> NOT disk space; System V semaphore limit too small; reduce `max_connections` or raise the limit.
- Client-side: `Connection refused ... Is the server running on that host and accepting TCP/IP connections?` -> typically `listen_addresses` not configured for remote TCP. `connection to server on socket "/tmp/.s.PGSQL.5432" failed: No such file or directory` -> check client socket path vs server `unix_socket_directories`. "Connection refused" here means the kernel found no listener, not that the server rejected the request (that produces the messages in ch.20.16).

### Kernel resources: shared memory and semaphores  [M1]  (source: kernel-resources.txt)

- PostgreSQL needs OS IPC: shared memory + semaphores (System V and/or POSIX; Windows has its own).
- **Default allocation**: "a very small amount of System V shared memory, as well as a much larger amount of anonymous mmap shared memory". Alternative: one large SysV region (`shared_memory_type = sysv`). Semaphores (SysV or POSIX) are created at server startup. **POSIX semaphores are used on Linux and FreeBSD; other platforms use System V semaphores.**
- SysV shared memory needed per server copy: "a few bytes ... (typically 48 bytes, on 64-bit platforms)". SHMMIN should be at most ~32 bytes (usually 1).
- **Table 18.1 System V IPC parameters** (values to run one instance):
  | Name | Description | Needed |
  |---|---|---|
  | SHMMAX | max size of shared memory segment (bytes) | at least 1kB (default usually much higher) |
  | SHMMIN | min size of shared memory segment (bytes) | 1 |
  | SHMALL | total shared memory available (bytes or pages) | same as SHMMAX if bytes, or ceil(SHMMAX/PAGE_SIZE) if pages, plus room for other apps |
  | SHMSEG | max shared memory segments per process | only 1 needed |
  | SHMMNI | max shared memory segments system-wide | like SHMSEG plus room for others |
  | SEMMNI | max semaphore identifiers (sets) | at least ceil(num_os_semaphores / 16) plus room |
  | SEMMNS | max semaphores system-wide | ceil(num_os_semaphores / 16) * 17 plus room |
  | SEMMSL | max semaphores per set | at least 17 |
  | SEMMAP | entries in semaphore map | see text (on the order of SEMMNS if it exists) |
  | SEMVMX | max value of semaphore | at least 1000 (default often 32767) |
- Semaphore accounting: one semaphore per allowed connection (`max_connections`), per allowed autovacuum worker (`autovacuum_worker_slots`), per allowed WAL sender (`max_wal_senders`), per allowed background process (`max_worker_processes`), etc., **in sets of 16**; each set has a **17th semaphore holding a "magic number"** to detect collisions with other applications' sets. Runtime-computed GUC **`num_os_semaphores`** reports the count: `postgres -D $PGDATA -C num_os_semaphores`. Same count for POSIX semaphores, but no kernel limit on platforms where POSIX is preferred.
- semget failure reports the confusing "No space left on device". SEMMNU/SEMUME (semaphore undo) do not affect PostgreSQL. SEMMAP full => freed semaphores lost until reboot.
- Per-OS: Linux `sysctl -w kernel.shmmax=17179869184; kernel.shmall=4194304` (16 GB example; defaults usually fine, SysV semaphores not used). FreeBSD `kern.ipc.shmall`, `kern.ipc.shmmax`, `kern.ipc.shm_use_phys` (lock SysV shm in RAM), jail `sysvshm=new`. NetBSD raise `kern.ipc.semmni`/`kern.ipc.semmns`. OpenBSD raise `kern.seminfo.semmni`/`semmns`. macOS `/etc/sysctl.conf` with `kern.sysv.shmmax=4194304, shmmin=1, shmmni=32, shmseg=8, shmall=1024` (all five must be set on some versions; SHMMAX multiple of 4096; SHMALL in 4 kB pages). Solaris/illumos: SHMMAX defaults to 1/4 RAM; `projadd ... -K "project.max-shm-memory=(privileged,8GB,deny)"`; `project.max-shm-ids=(priv,32768,deny)`, `max-sem-ids=(priv,4096,deny)`, `max-msg-ids=(priv,4096,deny)`.
- **systemd RemoveIPC**: `RemoveIPC` in `logind.conf` removes IPC objects when a (non-system) user fully logs out; defaults on in stock systemd. Symptom: parallel-query shared memory objects vanish: `WARNING: could not remove shared memory segment "/PostgreSQL.1450751626": No such file or directory`. Fix: create `postgres` as a system user (`useradd -r`, `adduser --system`) OR set `RemoveIPC=no` in `/etc/systemd/logind.conf`. "At least one of these two things has to be ensured, or the PostgreSQL server will be very unreliable."
- **Resource limits** (setrlimit; `ulimit`/`limit`; BSD `/etc/login.conf` `maxproc`, `openfiles`, `datasize` with `-cur`/`-max`): soft limit counts, hard limit only root can raise. "The PostgreSQL server uses one process per connection so you should provide for at least as many processes as allowed connections". Linux `fs.file-max`. Use `max_files_per_process` to cap PostgreSQL's fd use. Socket accept queue: default 128 on many platforms; `net.core.somaxconn` (Linux), `kern.ipc.soacceptqueue` (newer FreeBSD), `kern.ipc.somaxconn` (macOS/BSD); overflow gives "Resource temporarily unavailable" / "Connection refused"; restart PostgreSQL after raising.

### Linux memory overcommit / OOM killer and huge pages  [M1]  (source: kernel-resources.txt)

- Linux overcommit can let the kernel kill a postgres process, including the postmaster ("the supervisor server process"). Kernel log: `Out of Memory: Killed process 12345 (postgres).`
- If the postmaster is killed: all connections eventually terminate; restart needed. If a child is killed: PostgreSQL typically terminates all remaining connections and either recovers automatically (if `restart_after_crash` enabled) or shuts down.
- Mitigations: dedicated machine; more swap (OOM killer only fires when RAM+swap exhausted); lower `shared_buffers`, `work_mem`, `hash_mem_multiplier`; reduce `max_connections` and use external connection pooling; strict overcommit `sysctl -w vm.overcommit_memory=2` (and `vm.overcommit_ratio`).
- Protect the postmaster: `echo -1000 > /proc/self/oom_score_adj` in a root-owned startup script just before invoking postgres, plus `export PG_OOM_ADJUST_FILE=/proc/self/oom_score_adj` and `export PG_OOM_ADJUST_VALUE=0` so children run with normal score 0 (PG_OOM_ADJUST_VALUE defaults to zero if omitted; without PG_OOM_ADJUST_FILE children inherit the postmaster's -1000, "which is unwise").
- **Huge pages**: reduce overhead for large contiguous memory, especially large `shared_buffers`. Kernel needs `CONFIG_HUGETLBFS=y` and `CONFIG_HUGETLB_PAGE=y`. Runtime-computed GUC **`shared_memory_size_in_huge_pages`**: `postgres -D $PGDATA -C shared_memory_size_in_huge_pages` (example output 3170 with `Hugepagesize: 2048 kB`). Set `sysctl -w vm.nr_hugepages=3170`, or `echo 3170 > /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages`, or boot params `hugepagesz=2M hugepages=3170`. `huge_page_size` can request 2MB or 1GB. May need `vm.hugetlb_shm_group` and `ulimit -l`. Default behaviour (`huge_pages = try`): use when possible, fall back to normal pages; `huge_pages = on` => server fails to start if not enough huge pages.

### Shutdown modes  [M1, M7]  (source: server-shutdown.txt)

- All shutdown methods reduce to sending a signal to the supervisor `postgres` process (postmaster).
| Signal | Mode | Behaviour |
|---|---|---|
| SIGTERM | **Smart** | Disallows new connections, lets existing sessions end normally; shuts down only after all sessions terminate. If in recovery, recovery and streaming replication stop only after all regular sessions have terminated. |
| SIGINT | **Fast** | Disallows new connections and sends all existing server processes SIGTERM, causing them to abort current transactions and exit promptly; waits for all server processes to exit, then shuts down. |
| SIGQUIT | **Immediate** | Sends SIGQUIT to all child processes and waits; any not terminated **within 5 seconds** are sent SIGKILL. Supervisor exits as soon as all children have exited, without normal shutdown processing => **recovery (WAL replay) on next start**. Emergencies only. |
- `pg_ctl` sends these; or `kill -INT \`head -1 /usr/local/pgsql/data/postmaster.pid\``.
- Do not use SIGKILL on the postmaster: it prevents release of shared memory and semaphores, and the signal is not relayed to subprocesses (may need to kill them by hand).
- Terminate one session: `pg_terminate_backend()` or SIGTERM to that session's child process.

### Upgrading a cluster  [M7]  (source: upgrading.txt)

- Version numbers: since 10, `major.minor` (10.1 = major 10, minor 1). Before 10: three numbers, major = first two groups (9.5.3 = major 9.5, minor 3).
- Minor releases never change the internal storage format; upgrade = replace executables while server is down and restart; data directory unchanged.
- Major releases may change the internal storage format. Methods: (1) dump/restore with `pg_dumpall` (use the NEWER version's pg_dump/pg_dumpall; current dump programs read servers back to **9.2**); file-system-level backups do not work across major versions; checks prevent starting a wrong-version server on a data directory. Steps: `pg_dumpall > outputfile`; `pg_ctl stop`; `mv /usr/local/pgsql /usr/local/pgsql.old`; install new; `initdb -D ...`; restore pg_hba.conf/postgresql.conf changes; start; `psql -d postgres -f outputfile`. Least downtime: run both in parallel on different ports: `pg_dumpall -p 5432 | psql -d postgres -p 5433`. (2) `pg_upgrade` in-place, minutes with `--link`. (3) Logical replication to a newer-version standby then switchover (seconds of downtime); also pglogical, Slony, Londiste, Bucardo.
- Categories of change to test across majors: Administration, SQL, Library API, System Catalogs, Server C-language API. Read "Migration" sections of release notes for all intervening versions.

### Server spoofing, encryption options, SSL, GSSAPI encryption, SSH tunnels  [M6, M7]  (source: preventing-server-spoofing.txt, encryption-options.txt, ssl-tcp.txt, gssapi-enc.txt, ssh-tunnels.txt, event-log-registration.txt)

- Spoofing is possible only while the real server is down (any local user can start a server; it could read passwords and queries but not return data, since PGDATA is protected by directory permissions).
- Local defence: `unix_socket_directories` pointing to a directory writable only by a trusted user (optionally symlink `/tmp/.s.PGSQL.5432` to the relocated socket at boot); or client `requirepeer`.
- TCP defence: SSL with only `hostssl` entries + client `sslmode=verify-ca` or `verify-full` with root cert installed (or `sslrootcert=system`, which forces `sslmode=verify-full`); for SCRAM use `channel_binding=require` (a rogue server intercepting a SCRAM exchange could do offline analysis of the hashed password); GSSAPI: only `hostgssenc` entries with `gss` auth + client `gssencmode=require`.
- Encryption levels: (1) Password encryption: passwords stored as hashes per `password_encryption`; with SCRAM or MD5 the unencrypted password is never on the server; **MD5 is deprecated and will be removed in a future release**. (2) Specific columns: `pgcrypto` (key and plaintext briefly on the server). (3) Data partition encryption: eCryptfs, EncFS, PEFS; dm-crypt + LUKS, geli, gbde (protects stolen drives only, not a mounted FS). (4) Network: SSL (`host` vs `hostssl`), GSSAPI (`hostgssenc`, no password sent), Stunnel/SSH. (5) SSL host authentication (mutual certificates; prevents MITM). (6) Client-side encryption (untrusted server admin).
- SSL basics: "SSL" and "TLS" used interchangeably; SSL protocols themselves no longer supported. `ssl = on`; server listens for normal and SSL connections on the same TCP port and negotiates; by default SSL is at the client's option.
- Files: `server.crt` and `server.key` in data directory by default (`ssl_cert_file`, `ssl_key_file`). `server.key` must be `0600` (`chmod 0600 server.key`), or owned by root with group read (`0640`) for OS-managed keys. With group-readable data directory, certificate files may need to live outside it. Passphrase-protected key: server prompts and will not start until entered; disables SSL config reload unless `ssl_passphrase_command_supports_reload`; not usable on Windows.
- First certificate in `server.crt` must be the server's; intermediates may be appended (need `v3_ca` extensions); root cert not needed in server.crt (clients hold it).
- OpenSSL config `openssl.cnf` (dir from `openssl version -d`; override `OPENSSL_CONF`); `ssl_ciphers`; NULL-SHA/NULL-MD5 ciphers not recommended.
- Client certificates: put trusted root CAs in a file, set `ssl_ca_file`, add `clientcert=verify-ca` or `clientcert=verify-full` to `hostssl` lines. `verify-ca` = chain signed by trusted CA; `verify-full` = also the user name (or its mapping) must match the certificate `cn`. `clientcert` available for all auth methods but only on `hostssl` lines. Without `clientcert`, the client cert is verified only if presented and a CA is configured. CRLs via `ssl_crl_file` / `ssl_crl_dir`. Two approaches to force client certs: `cert` auth method, or any method + `clientcert`.
- Table 18.2: `ssl_cert_file` ($PGDATA/server.crt) server certificate; `ssl_key_file` ($PGDATA/server.key) private key; `ssl_ca_file` trusted CAs; `ssl_crl_file` revoked certificates. Read at server start and on config reload (on Windows also on each backend spawn). Error at start => refuses to start; error at reload => files ignored, old SSL config kept.
- Self-signed cert: `openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key -subj "/CN=dbhost.yourdomain.com"` then `chmod og-rwx server.key`. Root CA + server cert and root/intermediate/leaf recipes given (root 3650 days, intermediate 1825, leaf 365; `-extensions v3_ca`).
- GSSAPI encryption: negotiated on the same port; decision is the client's by default ("it can be downgraded by an attacker"); no setup beyond GSSAPI authentication.
- SSH tunnel: `ssh -L 63333:localhost:5432 joe@foo.com` then `psql -h localhost -p 63333 postgres`; the server sees a connection to its localhost bind address and does not consider it SSL-encrypted. `ssh -L 63333:foo.com:5432` would arrive on the foo.com bind address, not opened by default `listen_addresses = 'localhost'`. IANA private ports 49152-65535.
- Windows event log: `regsvr32 pgsql_library_directory/pgevent.dll` (event source `PostgreSQL`); `/n /i:event_source_name` for a different name; `/u` to unregister; requires `log_destination` to include `eventlog`.

### Setting parameters (GUC mechanics)  [M1, M7]  (source: config-setting.txt, runtime-config-file-locations.txt)

- Parameter names are case-insensitive. Five value types: **boolean, string, integer, floating point, enumerated (enum)**.
  - Boolean: `on, off, true, false, yes, no, 1, 0` (case-insensitive) or any unambiguous prefix.
  - String: single quotes, double embedded quotes; quotes optional for simple number/identifier.
  - Numeric: integers also accept hex (`0x`, must be quoted) and octal (leading `0`); fractional input to an integer GUC is rounded to nearest integer; no thousands separators.
  - Numeric with unit: default unit in `pg_settings.unit` (bytes, kilobytes, blocks (typically 8 kB), ms, s, min). Explicit unit must be quoted, e.g. `'120 ms'`; unit names are case-sensitive; whitespace allowed. **Memory units: B, kB, MB, GB, TB; multiplier is 1024.** **Time units: us, ms, s, min, h, d.** Fractional with unit is rounded to a multiple of the next smaller unit: `30.1 GB` => `30822 MB` (not 32319628902 B).
  - Enum: allowed values in `pg_settings.enumvals`; case-insensitive.
- `postgresql.conf`: one parameter per line; `=` optional; whitespace insignificant; `#` comments; non-simple values single-quoted; embedded quote as `''` (preferred) or `\'`; **if multiple entries for the same parameter, all but the last are ignored**.
- Reload: main server process rereads on **SIGHUP** (`pg_ctl reload` or `SELECT pg_reload_conf()`); postmaster propagates the signal to all server processes; existing sessions adopt new values after completing any currently-executing client command. Parameters that can only be set at server start are ignored until restart; invalid settings are ignored (but logged) on SIGHUP.
- `postgresql.auto.conf`: same format, edited by `ALTER SYSTEM`; read whenever postgresql.conf is; **its settings override postgresql.conf**. External tools editing it while the server runs is not recommended unless `allow_alter_system = off`.
- `pg_file_settings` view: pre-test config file changes / diagnose SIGHUP not taking effect.
- SQL-level: `ALTER SYSTEM` (global, equivalent to editing postgresql.conf); `ALTER DATABASE ... SET` (per-database override); `ALTER ROLE ... SET` (per-role, and per-role-in-database, overrides both). ALTER DATABASE/ROLE values are applied only when starting a fresh session; they override config-file and server command-line values.
- Session-level: `SHOW` / `current_setting(setting_name text)`; `SET` / `set_config(setting_name, new_value, is_local)`; some parameters only settable by superusers or users granted `SET` privilege on that parameter. `pg_settings` view = `SHOW ALL` with more detail; `UPDATE pg_settings SET setting = reset_val WHERE name = 'configuration_parameter';` equals `SET configuration_parameter TO DEFAULT;`.
- Shell: `postgres -c name=value` or `--name=value` (e.g. `postgres -c log_connections=all --log-destination='syslog'`): **overrides postgresql.conf and ALTER SYSTEM**, cannot be changed globally without restart. Client: `PGOPTIONS` env var for libpq, e.g. `env PGOPTIONS="-c geqo=off --statement-timeout=5min" psql`.
- Effective precedence (lowest to highest), as assembled from the text: built-in default < postgresql.conf (last entry wins) < postgresql.auto.conf < postgres command line `-c` < ALTER DATABASE SET < ALTER ROLE SET (role, then role-in-database) < PGOPTIONS/session `SET` < `SET LOCAL` / function `SET` clause.
- Include directives: `include 'filename'` (relative to the referencing file's directory; nestable; missing file is an error); `include_if_exists 'filename'` (missing/unreadable => log and continue); `include_dir 'directory'` (only non-directory files ending in `.conf`, names starting with `.` ignored; processed in file-name order by C locale rules: digits before letters, uppercase before lowercase). Convention: `conf.d/00shared.conf`, `01memory.conf`, `02server.conf`; later files override earlier.
- File locations (19.2): all default to inside the data directory.
  | GUC | Meaning | Context |
  |---|---|---|
  | `data_directory` | directory for data storage | server start only |
  | `config_file` | main config file (postgresql.conf) | postgres command line only |
  | `hba_file` | host-based auth file (pg_hba.conf) | server start only |
  | `ident_file` | user name map file (pg_ident.conf) | server start only |
  | `external_pid_file` | additional PID file for admin programs | server start only |
  To keep config elsewhere: `-D`/`PGDATA` points at the config directory, and `data_directory` (in postgresql.conf or command line) gives the real data location; `data_directory` overrides `-D`/`PGDATA` for data location but not for config-file location. If all of config_file, hba_file, ident_file, data_directory are set, `-D`/`PGDATA` is unnecessary. Relative paths are relative to the directory where postgres was started.

### Customized options  [M6]  (source: runtime-config-custom.txt)

- Two-part names `extension.parameter`, e.g. `plpgsql.variable_conflict`. Any two-part name is accepted even before the module is loaded and kept as a **placeholder** with no function. When the module loads it defines its variables and converts placeholder values; unrecognized placeholders beginning with its prefix produce warnings and are removed.
- Playground: `SET myapp.tenant_id = '42'; SELECT current_setting('myapp.tenant_id');` (common pattern for session variables / RLS).

### pg_hba.conf: structure and matching algorithm  [M1, M6]  (source: client-authentication.txt, auth-pg-hba-conf.txt)

- Authentication = server establishes client identity and whether it may connect as the requested database user. In ch.20 "database user" means "role with the LOGIN privilege". Method is chosen by (client) host address, database, and user. Database user names are logically separate from OS user names.
- File: `pg_hba.conf` (HBA = host-based authentication) in the data directory (or `hba_file`). Installed by initdb. Read at startup and on SIGHUP (`pg_ctl reload`, `pg_reload_conf()`, `kill -HUP`); **on Windows changes apply immediately to new connections**. Pre-test/diagnose with view **`pg_hba_file_rules`** (non-null `error` column => problem line).
- Syntax: one record per line; `#` comments; trailing backslash continues a line (even inside quotes/comments); fields separated by spaces/tabs; double-quote to include whitespace; **quoting a keyword (`all`, `replication`, ...) removes its special meaning**.
- **Matching algorithm**:
  1. Records are examined sequentially for each connection attempt.
  2. The **first** record whose connection type, client address, requested database and user name all match is used.
  3. **No fall-through**: if that record's authentication fails, later records are not considered.
  4. If no record matches, access is denied (`FATAL: no pg_hba.conf entry for host ...`).
  5. Hence order matters: earlier records typically have tight match parameters and weaker methods; later ones looser matches and stronger methods.
- Record formats:
```
local         database user auth-method [auth-options]
host          database user address auth-method [auth-options]
hostssl       database user address auth-method [auth-options]
hostnossl     database user address auth-method [auth-options]
hostgssenc    database user address auth-method [auth-options]
hostnogssenc  database user address auth-method [auth-options]
host ...      database user IP-address IP-mask auth-method [auth-options]   (same for the other host* types)
include file | include_if_exists file | include_dir directory
```
- Connection types: `local` (Unix-domain sockets; without one, socket connections are disallowed), `host` (TCP/IP, SSL or not, GSSAPI-encrypted or not), `hostssl` (TCP/IP with SSL only; ignored with a warning if SSL not built/enabled), `hostnossl` (TCP/IP without SSL), `hostgssenc` (TCP/IP with GSSAPI encryption only), `hostnogssenc` (TCP/IP without GSSAPI encryption). Remote TCP also requires `listen_addresses`.
- `database` field: `all`; `sameuser` (database named like the user); `samerole` (user is a member of the role named like the database; `samegroup` obsolete spelling; superusers count only if explicit members); `replication` (physical replication connections only; logical replication connections specify a database and do not match it); a name; a regular expression if it starts with `/`; comma-separated lists; `@file` to read names from a file.
- `user` field: `all`; a role name; `/regex`; `+role` = any role that is directly or indirectly a member of that role (superusers only if explicit members); lists; `@file`.
- `address` field: CIDR `172.20.143.89/32`, `172.20.143.0/24`, `10.6.0.0/16`, `::1/128`, `fe80::7a31:c1ff:0000:0000/96`, `0.0.0.0/0` (all IPv4), `::0/0` (all IPv6); no whitespace around `/`; don't omit trailing zeroes. IPv4 entries match only IPv4 connections and IPv6 only IPv6 (even IPv4-in-IPv6). Keywords `all`, `samehost` (any of the server's own IPs), `samenet` (any address in a directly connected subnet). Host names: reverse DNS of client IP must match (case-insensitive), then forward lookup must return the client IP; leading dot `.example.com` matches suffix (not `example.com` itself). Rationale: at most two resolver lookups per connection; resolver problems stay local to that client. Alternative separate `IP-mask` column (`255.0.0.0` = /8, `255.255.255.255` = /32). Not applicable to `local`.
- `auth-method` values are lower-case and case-sensitive.
- Auth options `name=value` after the method. Method-independent `clientcert=verify-ca|verify-full` on any `hostssl` record. `clientname=CN` (default; match user against certificate Common Name) or `clientname=DN` (entire Distinguished Name in RFC 2253 format; inspect with `openssl x509 -in myclient.crt -noout -subject -nameopt RFC2253 | sed "s/^subject=//"`) on any record using client certificates.
- Include directives as in postgresql.conf; `include_dir` takes files not starting with `.` and ending `.conf`, in C-locale file name order. `@` files are lists separated by whitespace or commas, `#` comments, nestable, relative to the referencing file.
- Tip: users also need the database `CONNECT` privilege; restricting via GRANT/REVOKE CONNECT is usually easier than pg_hba rules.
- Example 20.1 highlights: `local all all trust`; `host all all 127.0.0.1/32 trust`; `host "/^db\d{2,4}$" all localhost trust`; `host postgres all 192.168.93.0/24 ident`; `host all mike .example.com md5` before `host all all .example.com scram-sha-256`; reject then `hostgssenc all all 0.0.0.0/0 gss`; `host all all 192.168.0.0/16 ident map=omicron`; `local sameuser all scram-sha-256`, `local all /^.*helpdesk$ ...`, `local all @admins,+support scram-sha-256`, `local db1,db2,@demodbs all scram-sha-256`.

### User name maps (pg_ident.conf)  [M6]  (source: auth-username-maps.txt)

- Used with external-identity methods (ident, peer, GSSAPI, SSPI, cert, OAuth...) via `map=map-name` in pg_hba.conf. File `pg_ident.conf` (or `ident_file`); lines `map-name system-username database-username` plus include directives. Reloaded on SIGHUP. Diagnostic view **`pg_ident_file_mappings`**.
- Semantics: an entry means "this OS user is allowed to connect as this database user" (many-to-many). Connection allowed if any entry pairs the external name with the requested role.
- `database-username` = `all` => may log in as any existing role; `+role` => any member of role; quoting removes special meaning.
- `system-username` starting with `/` is a regex with one optional capture, referenced as `\1` in database-username: `mymap /^(.*)@mydomain\.com$ \1` and `mymap /^(.*)@otherdomain\.com$ guest`. Quoting does not disable `\1`. A database-username starting with `/` is itself a regex (cannot use `\1`). Anchor with `^...$` (regex can match partially).
- Example 20.2 (map `omicron`): bryanh->bryanh, ann->ann, robert->bob, bryanh->guest1.

### Authentication methods  [M6]  (source: auth-methods.txt, auth-trust.txt, auth-password.txt, gssapi-auth.txt, sspi-auth.txt, auth-ident.txt, auth-peer.txt, auth-ldap.txt, auth-radius.txt, auth-cert.txt, auth-pam.txt, auth-bsd.txt, auth-oauth.txt)

- Recommendation: **peer for local connections** (trust may suffice sometimes); password authentication is easiest for remote; others need external infrastructure or are platform-specific.
- **trust**: anyone who can connect may be any user, even superuser (database/user columns still apply). OK on a single-user workstation, or on multiuser machines when the socket is restricted via `unix_socket_permissions`/`unix_socket_group`/`unix_socket_directories`; filesystem permissions do not protect local TCP, so remove or change the `host ... 127.0.0.1 ... trust` line. Rarely reasonable for TCP other than localhost.
- **Password methods**:
  - `scram-sha-256`: RFC 7677 challenge-response; prevents sniffing; stored hash thought secure; most secure, unsupported by older client libraries.
  - `md5`: custom challenge-response; no protection if the hash is stolen; MD5 not secure against determined attacks. **If `md5` is specified but the stored password is SCRAM, SCRAM is used automatically.** Deprecated.
  - `password`: cleartext over the network; acceptable only under SSL.
  - Passwords stored in **`pg_authid`** (hashed per `password_encryption` at the time the password is set; plaintext storage no longer possible). No password set => password auth always fails. `CREATE ROLE foo WITH LOGIN PASSWORD 'secret'` or psql `\password`.
  - Compatibility: SCRAM-hashed password works with methods `scram-sha-256`, `md5` (auto-switch), `password`; MD5-hashed works only with `md5` and `password`.
  - Migration: ensure clients support SCRAM; `password_encryption = 'scram-sha-256'`; all users set new passwords; change pg_hba methods to `scram-sha-256`.
- **gss** (GSSAPI, RFC 2743; TCP only; can combine with GSSAPI encryption): Kerberos service principal `servicename/hostname@realm` (servicename default `postgres`, libpq `krbsrvname`); principal read from the keytab (`krb_server_keyfile`; use a dedicated keytab readable by the server account; `kadmin% addprinc -randkey postgres/server.my.domain.org`; `ktadd -k krb5.keytab postgres/server.my.domain.org`). Options: `include_realm` (default 1; 0 strips realm, discouraged unless `krb_realm` set), `map`, `krb_realm`. Server-wide `krb_caseins_users`.
- **sspi** (Windows only; negotiate mode: Kerberos, falls back to NTLM; interoperates with GSSAPI): options `include_realm`, `compat_realm` (default 1: NetBIOS/SAM-compatible domain name), `upn_username` (default off), `map`, `krb_realm`.
- **ident** (RFC 1413, ident server on TCP port 113 of the client; TCP only; on local connections peer is used instead): option `map`. Depends on client integrity; only for closed, tightly controlled networks ("The Identification Protocol is not intended as an authorization or access control protocol." RFC 1413). Encrypted ident responses must not be used.
- **peer** (local only): OS user name from the kernel (`getpeereid()`, `SO_PEERCRED`); Linux, most BSDs incl. macOS, Solaris; option `map`.
- **ldap**: only validates name/password (role must already exist). Modes: **simple bind** (bind DN = `ldapprefix` + username + `ldapsuffix`) and **search+bind** (bind with `ldapbinddn`/`ldapbindpasswd` or anonymously, search subtree `ldapbasedn` for `ldapsearchattribute` (default `uid`) or `ldapsearchfilter` with `$username`, then re-bind as the found DN with the client's password; two extra LDAP requests). Common options: `ldapserver` (space-separated), `ldapport`, `ldapscheme=ldaps`, `ldaptls=1` (StartTLS, RFC 4513; encrypts only PG<->LDAP). `ldapurl` = RFC 4516 `ldap[s]://host[:port]/basedn[?[attribute][?[scope][?[filter]]]]` (scope base|one|sub, default base; OpenLDAP only, not Windows). Mixing simple-bind and search+bind options is an error. Omitting `ldapserver` with OpenLDAP => DNS SRV lookup `_ldap._tcp.DOMAIN` from ldapbasedn. Example: `host ... ldap ldapserver=ldap.example.net ldapprefix="cn=" ldapsuffix=", dc=example, dc=net"`; `ldapurl="ldap://ldap.example.net/dc=example,dc=net?uid?sub"`; filter `"(|(uid=$username)(mail=$username))"`.
- **radius**: validates name/password; Access Request of type Authenticate Only with user name, encrypted password, NAS Identifier; Access Accept/Reject; no accounting. Multiple servers tried sequentially (negative response fails, no response => next). Options `radiusservers` (required), `radiussecrets` (required; >= 16 chars recommended; strong encryption vector only with OpenSSL builds), `radiusports` (default 1812), `radiusidentifiers` (default `postgresql`). Double-double quoting for whitespace: `radiussecrets="""secret one"",""secret two"""`.
- **cert**: SSL only; requires valid trusted client certificate; no password prompt; certificate `cn` compared to requested user (or via `map`). cert = trust + `clientcert=verify-full` (so clientcert is redundant).
- **pam**: service name default `postgresql` (`pamservice`); `pam_use_hostname=1` passes resolved host name as PAM_RHOST (default IP). PAM reading `/etc/shadow` fails because the server is not root.
- **bsd** (OpenBSD only): login type `auth-postgresql`, login class `postgresql` if defined in login.conf; server OS user must be in the `auth` group.
- **oauth** (new in PostgreSQL 18): OAuth 2.0 (RFC 6749) bearer tokens (RFC 6750), sent in clear text => use SSL. Terminology: resource owner/end user, client (libpq apps such as psql), resource server (the PostgreSQL cluster), provider, authorization server (not provided by PostgreSQL), issuer (https URL). Options: `issuer` (required; discovery document at issuer + `/.well-known/openid-configuration` unless the issuer already contains `/.well-known/`; must exactly match discovery document and client `oauth_issuer`), `scope` (required, space-separated), `validator` (must match an entry in `oauth_validator_libraries`; required if more than one is listed), `map` (else token's user name must exactly match the role), `delegate_ident_mapping=1` (validator takes full responsibility for mapping; incompatible with `map`). PostgreSQL is OIDC-compatible but not itself an OIDC client.
- `reject`: reject unconditionally (filter out specific hosts before a broader allow line).

### Authentication problems  [M6]  (source: client-authentication-problems.txt)

- `FATAL: no pg_hba.conf entry for host "123.123.123.123", user "andym", database "testdb"` => server reached, no matching record.
- `FATAL: password authentication failed for user "andym"` => matched a record, failed its method (check password, Kerberos, ident).
- `FATAL: user "andym" does not exist`.
- `FATAL: database "testdb" does not exist` (default database name = user name).
- The server log may contain more detail than the client sees.

### Roles: concepts, attributes, membership, dropping  [M1, M5, M6]  (source: user-manag.txt, database-roles.txt, role-attributes.txt, role-membership.txt, role-removal.txt, perm-functions.txt)

- A role = a database user or a group, or both; roles subsume users and groups (distinct before 8.1). Roles can own objects and grant privileges on them; membership lets a member use another role's privileges.
- Roles are **global across the cluster** (not per database) and separate from OS users. `CREATE ROLE name;` / `DROP ROLE name;`; shell wrappers `createuser name` / `dropuser name`. List: `SELECT rolname FROM pg_roles;`, `SELECT rolname FROM pg_roles WHERE rolcanlogin;`, psql `\du`.
- Bootstrap: a fresh cluster has one predefined login-capable **superuser** role named like the OS user that ran initdb (often `postgres`) unless overridden.
- Role used for a connection is chosen by the client (psql `-U`; many tools default to the OS user name); the allowed set is determined by client authentication (ch.20).
- `CREATE USER` = `CREATE ROLE ... LOGIN`; `CREATE ROLE` default is NOLOGIN.
- Role-specific GUC defaults: `ALTER ROLE myname SET enable_indexscan TO off;` (applied at the start of subsequent sessions, as if SET was issued just before session start); `ALTER ROLE rolename RESET varname`. Useless on roles without LOGIN.
- **CREATEROLE details**: can alter and drop roles on which it has ADMIN OPTION; when a non-superuser CREATEROLE user creates a role it is automatically granted back as if the bootstrap superuser ran `GRANT created_user TO creating_user WITH ADMIN TRUE, SET FALSE, INHERIT FALSE` (cannot be removed by the CREATEROLE user; superusers can change it). Since ADMIN lets one grant membership to anyone, the creator can grant it to itself with INHERIT/SET ("a safeguard against accidents, not a security feature"); `createrole_self_grant` automates this. CREATEROLE cannot create SUPERUSER roles or touch existing superusers, cannot create REPLICATION users or grant/revoke REPLICATION or modify their properties (but may use ALTER ROLE ... SET/RENAME, COMMENT, SECURITY LABEL, DROP ROLE on them), and cannot grant/revoke BYPASSRLS.
- **Membership**: `GRANT group_role TO role1, ...;` / `REVOKE group_role FROM role1, ...;`. Circular membership is refused; granting membership to PUBLIC is not permitted. Two ways to use a group's privileges:
  1. **SET option** (default TRUE): `SET ROLE group_role` temporarily becomes the role; only its privileges apply and objects created are owned by it. SET ROLE may select any role reachable through a chain of grants each having SET TRUE (no need to step through intermediates).
  2. **INHERIT option**: automatically use privileges of roles one is directly or indirectly a member of; the chain stops at a membership lacking INHERIT. Role attribute `NOINHERIT` changes the default for that role's grants; per-grant `WITH INHERIT TRUE|FALSE` overrides.
- Example: `CREATE ROLE joe LOGIN; CREATE ROLE admin; CREATE ROLE wheel; CREATE ROLE island; GRANT admin TO joe WITH INHERIT TRUE; GRANT wheel TO admin WITH INHERIT FALSE; GRANT island TO joe WITH INHERIT TRUE, SET FALSE;` => joe initially has joe + admin + island privileges, not wheel. `SET ROLE admin` => only admin's. `SET ROLE wheel` (allowed directly) => only wheel's. `SET ROLE island` impossible. Restore with `SET ROLE joe; SET ROLE NONE; RESET ROLE;`.
- SQL standard: users don't inherit, roles do; emulate with NOINHERIT on user roles. PostgreSQL defaults to INHERIT for backward compatibility.
- **LOGIN, SUPERUSER, CREATEDB, CREATEROLE are never inherited**; you must `SET ROLE` to a role having them to use them.
- `DROP ROLE` of a group revokes its memberships automatically.
- **Dropping a role that owns objects** (recipe):
  1. Optionally transfer specific objects: `ALTER TABLE bobs_table OWNER TO alice;`
  2. `REASSIGN OWNED BY doomed_role TO successor_role;` (per database; the first run also reassigns shared objects: databases, tablespaces)
  3. `DROP OWNED BY doomed_role;` (per database; drops remaining owned objects and revokes privileges granted to the role on others' objects; does not drop databases or tablespaces)
  4. Repeat 2-3 in every database of the cluster, then `DROP ROLE doomed_role;`
  - Order matters: REASSIGN OWNED then DROP OWNED. DROP ROLE with remaining dependencies lists the objects.
- **Function security**: functions, triggers and RLS policies let users "Trojan horse" others. Defences: tightly control who can define objects; query only objects with trusted owners; remove from search_path schemas where untrusted users can create objects. Functions run with the OS permissions of the server daemon; languages with unchecked memory access are "untrusted" and only superusers may create functions in them.

### Managing databases and template databases  [M1, M2]  (source: managing-databases.txt, manage-ag-overview.txt, manage-ag-createdb.txt, manage-ag-templatedbs.txt, manage-ag-config.txt, manage-ag-dropdb.txt)

- Hierarchy: **cluster -> database -> schema -> table (or other object)**. A few objects (role, database, tablespace names) are cluster-level, stored in the **`pg_global`** tablespace; databases are isolated from each other but can access cluster-level objects. SQL standard calls databases "catalogs".
- A connection specifies exactly one database; **no cross-database access per connection** (use postgres_fdw or dblink). Database-level security = access control (pg_hba.conf, connection level) + authorization (GRANT). By default all users can connect to all databases by all methods.
- Unrelated projects => separate databases; interrelated => same database, separate schemas. Caveat: all databases share one WAL, which binds them together for backup and recovery.
- List: `SELECT datname FROM pg_database;`, psql `\l` / `psql -l`.
- `CREATE DATABASE name;` (creator becomes owner; owner may drop it, removing all objects even if owned by others). Restricted operation (CREATEDB). First database `postgres` is created by initdb; `createdb dbname` just connects to `postgres` and runs CREATE DATABASE (no argument => database named like the current user). `CREATE DATABASE dbname OWNER rolename;` / `createdb -O rolename dbname` — only superusers can create a database for a role they are not a member of.
- **Templates**: CREATE DATABASE copies an existing database, by default **`template1`**; objects added to template1 (e.g. PL/Perl) appear in all later databases. **Database-level GRANT permissions are not copied**; the new database gets default database-level permissions.
- **`template0`** = pristine initial contents of template1; never change it. Use it to (a) restore a pg_dump into a pristine database, (b) **specify new encoding and locale settings** (a copy of template1 must keep its settings because it may contain encoding/locale-specific data). `CREATE DATABASE dbname TEMPLATE template0;` / `createdb -T template0 dbname`.
- Any database can be a template, but this is not a general "COPY DATABASE": **no other sessions may be connected to the source** (CREATE DATABASE fails if any exist when it starts; new connections are blocked during the copy).
- `pg_database` flags: **`datistemplate`** (if true any user with CREATEDB can clone it; else only superusers and the owner); **`datallowconn`** (false => no new connections; existing ones not terminated). template0 normally has `datallowconn = false`; both templates have `datistemplate = true`. template1 has no special status beyond being the default source name; it can be dropped (after setting datistemplate=false) and recreated from template0. `postgres` is also just a copy of template1.
- Per-database defaults: `ALTER DATABASE mydb SET geqo TO off;` (saved, applied as if SET just before each new session); `ALTER DATABASE dbname RESET varname`.
- `DROP DATABASE name;` — owner or superuser; irreversible; cannot be run while connected to that database (connect to another, e.g. template1 for the last user database). `dropdb dbname` (no default-to-username behaviour).

### Tablespaces  [M2, M1]  (source: manage-ag-tablespaces.txt)

- Define file-system locations for database object files; uses: overflow onto another volume, and placing hot indexes on fast storage / archive tables on slow storage.
- **Warning: tablespaces are an integral part of the cluster**, dependent on metadata in the main data directory; cannot be attached to another cluster or backed up individually; losing one can make the cluster unreadable or unable to start; never on a RAM disk / temporary FS / removable storage.
- `CREATE TABLESPACE fastspace LOCATION '/ssd1/postgresql/data';` — location must be an existing, empty directory owned by the PostgreSQL OS user. Creation requires superuser; then `GRANT CREATE ON TABLESPACE` to let others use it. Little point in more than one tablespace per logical file system.
- Use: `CREATE TABLE foo(i int) TABLESPACE space1;` or `SET default_tablespace = space1;` (implicit TABLESPACE for CREATE TABLE and CREATE INDEX). `temp_tablespaces` list for temp tables/indexes and temporary files (random member per object).
- A database's tablespace stores that database's **system catalogs** and is the default for its tables, indexes and temp files. A database created without TABLESPACE uses its template's tablespace.
- Built-in tablespaces created by initdb: **`pg_global`** (only shared system catalogs) and **`pg_default`** (default tablespace of template1 and template0, hence of other databases).
- A tablespace is usable from any database, so it cannot be dropped until all objects in all databases using it are gone. `DROP TABLESPACE` removes an empty one.
- Inspect: `SELECT spcname, spcowner::regrole, pg_tablespace_location(oid) FROM pg_tablespace;`, psql `\db`.
- **`$PGDATA/pg_tblspc`** contains symbolic links to each non-built-in tablespace (named by tablespace OID); relinking by hand is possible but never while the server runs. (`allow_in_place_tablespaces` makes real directories there instead, for testing.)
- Related GUCs: per-tablespace `seq_page_cost`, `random_page_cost`, `effective_io_concurrency`, `maintenance_io_concurrency` via ALTER TABLESPACE; `file_copy_method` affects `ALTER DATABASE ... SET TABLESPACE`.

### Locale support  [M2, M4, M1]  (source: charset.txt, locale.txt)

- PostgreSQL uses the OS's ISO C and POSIX locale facilities. initdb takes the locale from its environment unless `--locale=sv_SE` etc. Names `language_territory.codeset`, e.g. `fr_BE.UTF-8`; `locale -a` lists them; Windows uses names like `German_Germany`, `Swedish_Sweden.1252`.
- Categories: `LC_COLLATE` (string sort order), `LC_CTYPE` (character classification: what is a letter, upper-case equivalent), `LC_MESSAGES` (language of messages), `LC_MONETARY` (currency formatting), `LC_NUMERIC` (number formatting), `LC_TIME` (date/time formatting). initdb options per category, e.g. `initdb --locale=fr_CA --lc-monetary=en_US`. `C` = `POSIX` = behave as if no locale support.
- **LC_COLLATE and LC_CTYPE are fixed when a database is created** (they affect index sort order; changing them would corrupt text indexes); collations relax this per column/expression. Other categories are GUCs (lc_messages, lc_monetary, lc_numeric, lc_time) that initdb merely writes into postgresql.conf.
- Server locale comes from the **server's** environment, not the client's. Environment precedence per category: `LC_ALL`, then `LC_COLLATE` (the category variable), then `LANG`; none set => `C`. `LANGUAGE` may override message language (gettext). Message translation requires `--enable-nls`.
- Locale affects: ORDER BY and comparison operators on text; `upper`, `lower`, `initcap`; pattern matching (LIKE, SIMILAR TO, POSIX regex: case-insensitive matching and character classes); `to_char` family; **the ability to use indexes with LIKE**. Non-C locales slow character handling and prevent ordinary indexes from serving LIKE; workarounds: special operator classes (`text_pattern_ops` etc., Section 11.10) or indexes using the `C` collation.
- Selection scopes (each provides defaults for the next): OS environment -> initdb options -> per database (CREATE DATABASE / createdb) -> per column (collation) -> per query (COLLATE clause).
- **Locale providers** (`initdb --locale-provider=icu --icu-locale=en`; can mix per database and per collation; the OS still supplies messages):
  - `builtin`: only locales `C`, `C.UTF-8`, `PG_UNICODE_FAST`. `C` identical to libc C (may depend on encoding). `C.UTF-8` (UTF-8 only): code-point collation, regex classes "POSIX Compatible", "simple" case mapping. `PG_UNICODE_FAST` (UTF-8 only): code-point collation, "Standard" regex classes, "full" case mapping.
  - `icu`: external ICU library (build support needed); collation and classification independent of OS and database encoding (portable across platforms); LC_COLLATE/LC_CTYPE can be set independently of the ICU locale; **results may depend on the ICU library version**.
  - `libc`: OS C library; LC_COLLATE and LC_CTYPE control behaviour (cannot be set independently); same locale name may behave differently across platforms.
- ICU locale names are BCP 47 language tags (`ja-JP`, `fr`, `de`, `fr-CA`). Canonicalization: `en-US-u-kn-true` => `NOTICE: using standard form "en-US-u-kn"`; `de_DE.utf8` => `de-DE`. Empty language or `root` => `und`. Unknown => `WARNING: ICU locale "nonsense" has unknown language "nonsense"` with HINT about `icu_validation_level` (collation still created unless level is ERROR). Collation settings via `-u-key-value` (boolean keys without value = true): `en-US-u-kn-ks-level2` = numeric ordering + case-insensitive: `SELECT 'aB' = 'Ab' COLLATE mycollation5` => t; `'N-45' < 'N-123'` => t.
- Problems: check `locale -a`, SHOW the active settings; LC_COLLATE/LC_CTYPE only changeable by creating a new database; client apps should use SQLSTATE codes rather than parsing translated message text. Test suite in `src/test/locale`.

### Collation support  [M2, M3, M4]  (source: collation.txt)

- Every expression of a collatable type (built-in: `text`, `varchar`, `char`; collatable user base types; domains over them) has a collation: column reference => column's collation; constant => type's default collation; complex expression => derived from inputs. Can be "default" (database locale) or **indeterminate** (operations needing a collation then fail).
- Collation is used by ORDER BY (the sort key's collation), comparison operators, `lower`/`upper`/`initcap`, pattern matching, `to_char`. For functions returning a collatable type, the derived collation also becomes the result's collation at parse time.
- **Derivation/combination rules** (explicit = from a COLLATE clause; everything else implicit):
  1. If any input has an explicit derivation, all explicit collations must be the same (else error); that collation is the result.
  2. Otherwise all inputs must have the same implicit collation or the default; any non-default one wins; else the result is default.
  3. Conflicting non-default implicit collations => indeterminate; only an error (at run time) if the function/operator needs a collation.
- Example: `CREATE TABLE test1 (a text COLLATE "de_DE", b text COLLATE "es_ES", ...)`: `a < 'foo'` uses de_DE; `a < ('foo' COLLATE "fr_FR")` uses fr_FR; `a < b` is an error (fix: `a < b COLLATE "de_DE"`); `a || b` is fine (|| doesn't care), but `ORDER BY a || b` errors (fix `ORDER BY a || b COLLATE "fr_FR"`); `ORDER BY a || 'foo'` uses de_DE.
- A collation is an SQL schema object mapping a name to provider locales. libc collation = LC_COLLATE + LC_CTYPE pair (setlocale), **tied to an encoding** (same name can exist per encoding). ICU collation = named ICU collator, collate and ctype always the same, **encoding-independent** (one per name per database).
- **Standard collations** (all platforms): `unicode` (UCA with DUCET, all encodings, needs ICU, = ICU root/`und-x-icu`); `ucs_basic` (code-point order, only ASCII A-Z are letters, stable across versions, UTF8 only, = libc C in UTF8); `pg_unicode_fast` (code points, full case mapping, Standard regex properties, stable within a major version, UTF8 only); `pg_c_utf8` (code points, simple case mapping, POSIX Compatible properties, stable within a major version, UTF8 only); `C` / `POSIX` (byte-value order, only ASCII letters, stable for a given encoding); `default` (database's locale).
- Predefined collations: initdb populates `pg_collation` from all OS locales (if newlocale() support) and ICU locales. Inspect `SELECT * FROM pg_collation` or psql `\dOS+`. libc: OS locale `de_DE.utf8` gives collations `de_DE.utf8` and stripped `de_DE` (recommended). Later OS locales: `CREATE COLLATION` or `pg_import_system_collations()`. Only collations matching the database encoding are considered (default, C, POSIX are usable with any encoding). **Distinct collation objects are incompatible even if identical**: `a COLLATE "C" < b COLLATE "POSIX"` errors.
- ICU collations named as BCP 47 tag + `-x-icu`: `de-x-icu`, `de-AT-x-icu`, `und-x-icu` (root, language-agnostic). Unsupported encodings ignore them (`collation "de-x-icu" for encoding "WIN874" does not exist`).
- Creating: `CREATE COLLATION german (provider = libc, locale = 'de_DE');`, `CREATE COLLATION german (provider = icu, locale = 'de-DE');`, copy `CREATE COLLATION german FROM "de_DE";`, `CREATE COLLATION french FROM "fr-x-icu";`. Standard/predefined ones live in `pg_catalog`; create user collations in user schemas (dumped by pg_dump).
- **Nondeterministic collations** (`deterministic = false`): strings may compare equal despite different bytes (case-/accent-insensitive, different Unicode normal forms); deterministic collations break ties bytewise. All standard/predefined and user collations default to deterministic. Examples: `CREATE COLLATION ndcoll (provider = icu, locale = 'und', deterministic = false);`, `case_insensitive (... locale = 'und-u-ks-level2', deterministic = false)`, `ignore_accents (... 'und-u-ks-level1-kc-true', deterministic = false)`. Drawbacks: performance penalty; **B-tree cannot use deduplication with nondeterministic collations**; some pattern-matching operations are not possible. Alternative: `normalize()` / `IS NORMALIZED`.
- ICU custom examples: `ignore_accent_case` (`und-u-ks-level1`, nondeterministic): `'Å' = 'A'` true, `'z' = 'Z'` true; `upper_first` (`und-u-kf-upper`): `'B' < 'b'` true; `num_ignore_punct` (`und-u-ka-shifted-kn`, nondeterministic): `'id-45' < 'id-123'` true, `'w;x*y-z' = 'wxyz'` true.
- Table 23.1 ICU comparison levels (which differences count for equality): level1 base character (only 'y'='z' false); level2 + accents ('n'='ñ' false); level3 + case/variants ('g'='G' false; default); level4 + punctuation (only with `ka-shifted`; 'x-y'='x_y' false); identic: all (U+2063 invisible separator `'ab' = U&'a\2063b'` false). Basic normalization always happens (`U&'\0061\0301'` = `U&'\00E1'` even at identic); use a deterministic collation to distinguish code-point representations.
- Table 23.2 ICU collation settings: `co` (emoji, phonebk, standard...; default standard) collation type; `ka` (noignore|shifted; default noignore) ignore punctuation/space (needs ks <= level3; kv picks classes); `kb` (default false) backwards level-2 comparison (`und-u-kb` sorts 'àe' before 'aé'); `kc` (default false) case as "level 2.5" (with ks=level1: ignore accents but not case); `kf` (upper|lower|false) case-first ordering; `kn` (default false) numeric ordering of digit sequences; `kk` (default false) full normalization (e.g. `U&'\0065\0323\0302'` = `U&'\0065\0302\0323'`); `kr` (space, punct, symbol, currency, digit, script-id like latn/grek) reorder character classes; `ks` (level1..level4, identic; default level3) strength; `kv` (space|punct|symbol|currency; default punct) classes ignored at level 3 (cumulative; needs ka=shifted, ks<=level3). Many settings need `deterministic = false` to have the desired effect.
- Setting examples: `"de-u-co-phonebk-x-icu"` (German phone book), `"und-u-co-emoji-x-icu"` (UTS #51 emoji), `latinlast` `en-u-kr-grek-latn` (Greek before Latin), `upperfirst` `en-u-kf-upper`, `special` `en-u-kf-upper-kr-grek-latn`.
- Tailoring rules: `CREATE COLLATION custom (provider = icu, locale = 'und', rules = '&V << w <<< W');` (W after V as a secondary difference); `ebcdic` collation example ordering ASCII as EBCDIC: result order `! a b ^ A B 1 2`.

### Character set support  [M2, M6]  (source: multibyte.txt)

- Encodings: single-byte (ISO 8859 series), multibyte (EUC, UTF-8, Mule internal code). All usable by clients; some not as server encodings. Default chosen by initdb; overridable per database.
- **Each database's encoding must be compatible with its LC_CTYPE and LC_COLLATE**: with C/POSIX any encoding works; for other libc locales only one encoding works (Windows: UTF-8 works with any locale); ICU locales work with most server encodings.
- `initdb -E EUC_JP` (`--encoding`); without it, derived from the locale. Per database: `createdb -E EUC_KR -T template0 --lc-collate=ko_KR.euckr --lc-ctype=ko_KR.euckr korean` or `CREATE DATABASE korean WITH ENCODING 'EUC_KR' LC_COLLATE='ko_KR.euckr' LC_CTYPE='ko_KR.euckr' TEMPLATE=template0;` (must copy template0 to change encoding/locale). Stored in `pg_database`; `psql -l` shows Encoding, Collation, Ctype, Access Privileges (e.g. template0 `{=c/hlinnaka,hlinnaka=CTc/hlinnaka}`).
- Modern OSes: PostgreSQL derives the charset implied by LC_CTYPE and enforces the matching encoding. Superusers may create SQL_ASCII databases with non-C LC_CTYPE: deprecated, may be forbidden.
- **SQL_ASCII**: bytes 0-127 interpreted as ASCII, 128-255 uninterpreted; no conversion, no validation: "a declaration of ignorance about the encoding". Unwise with non-ASCII data. A SQL_ASCII *client* disables conversion, but a non-SQL_ASCII server still validates incoming data.
- Client encoding selection: psql `\encoding SJIS`; libpq functions; `SET CLIENT_ENCODING TO 'value';` or SQL-standard `SET NAMES 'value';`; `SHOW client_encoding;`; `RESET client_encoding;`; env `PGCLIENTENCODING`; GUC `client_encoding`. Unconvertible characters raise an error (e.g. EUC_JP server, LATIN1 client).
- Conversions: any pair with a conversion function in **`pg_conversion`**; `CREATE CONVERSION` (must be marked "default" for automatic client/server use). Conversion names: official source name with non-alphanumerics replaced by `_`, then `_to_`, then destination (e.g. `iso_8859_1_to_utf8`, `windows_1251_to_koi8_r`, `mic_to_sjis`).
- JDBC does not support MULE_INTERNAL, LATIN6, LATIN8, LATIN10.

## Complete inventories

GUC tables below follow the docs section order of ch.19 (19.2 file locations is in the notes above). Context vocabulary is defined in the first table.

### GUC inventory conventions  [M1, M4, M7]

Context column vocabulary used in all GUC tables below (mapped from the docs' wording):
- **postmaster** = "can only be set at server start" (restart required).
- **sighup** = "can only be set in the postgresql.conf file or on the server command line" (reload suffices, no per-session SET).
- **superuser** = "Only superusers and users with the appropriate SET privilege can change this setting" (session-settable by privileged roles).
- **user** = docs state no restriction (any session may SET it).
- **backend / sb-backend** = fixed at connection start (sb = superuser/SET privilege only).
- **internal** = read-only preset / computed.
- "blocks" = BLCKSZ bytes, typically 8kB. Where the docs give a unit-less interpretation it is listed as Unit.

### GUC 19.3 Connections and Authentication  [M1, M7]  (source: runtime-config-connection.txt)

**19.3.1 Connection Settings**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `listen_addresses` | string | `localhost` | - | postmaster | Comma-separated host names/IPs to listen on. `*` = all interfaces, `0.0.0.0` = all IPv4, `::` = all IPv6; empty = no TCP at all (Unix sockets only). Server starts if at least one address can be opened (warning for others). |
| `port` | integer | 5432 | - | postmaster | TCP port, same for all addresses. |
| `max_connections` | integer | typically 100 (may be less, determined by initdb from kernel settings) | - | postmaster | Max concurrent connections. Sizes shared-memory resources. Standby must have >= primary's value or queries are not allowed on the standby. |
| `reserved_connections` | integer | 0 | - | postmaster | Slots reserved for roles with privileges of `pg_use_reserved_connections`. When free slots > superuser_reserved_connections but <= superuser_reserved_connections + reserved_connections, only superusers and those roles are accepted. Must be < max_connections - superuser_reserved_connections. |
| `superuser_reserved_connections` | integer | 3 | - | postmaster | Slots reserved for superusers: when active connections >= max_connections - this, only superusers accepted. Final emergency reserve. Must be < max_connections - reserved_connections. |
| `unix_socket_directories` | string | normally `/tmp` (build-time changeable); empty on Windows | - | postmaster | Comma-separated directories for Unix-domain sockets; empty = none. Value starting with `@` = Linux abstract-namespace socket (convention `@/tmp`). Socket file `.s.PGSQL.nnnn` (nnnn = port) plus ordinary lock file `.s.PGSQL.nnnn.lock`; never remove manually. |
| `unix_socket_group` | string | '' (server user's default group) | - | postmaster | Owning group of socket. Ignored on Windows and for abstract sockets. |
| `unix_socket_permissions` | integer | 0777 | chmod mode (octal needs leading 0) | postmaster | Socket permissions; only write permission matters. Alternatives 0770, 0700. Ignored on Solaris 10 and abstract sockets. Independent of pg_hba.conf. |
| `bonjour` | boolean | off | - | postmaster | Advertise via Bonjour. |
| `bonjour_name` | string | '' (computer name) | - | postmaster | Bonjour service name. |

**19.3.2 TCP Settings**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `tcp_keepalives_idle` | integer | 0 (OS default; Windows 0 => 2 hours) | s | user | Idle time before OS sends TCP keepalive. Needs TCP_KEEPIDLE; ignored (reads 0) on Unix sockets. |
| `tcp_keepalives_interval` | integer | 0 (OS default; Windows 0 => 1 second) | s | user | Retransmit interval for unacknowledged keepalive (TCP_KEEPINTVL). |
| `tcp_keepalives_count` | integer | 0 (OS default) | - | user | Lost keepalives before connection is considered dead (TCP_KEEPCNT; not Windows). |
| `tcp_user_timeout` | integer | 0 (OS default) | ms | user | Time transmitted data may stay unacknowledged before connection is forcibly closed (TCP_USER_TIMEOUT; not Windows). |
| `client_connection_check_interval` | integer | 0 (disabled) | ms | user | Interval between polls of the socket while running a query, so long queries abort sooner if the client is gone. Linux, macOS, illumos, BSDs only. Without it loss is detected only at next socket interaction. |

**19.3.3 Authentication**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `authentication_timeout` | integer | 1min | s | sighup | Max time to complete client authentication, else server closes connection. |
| `password_encryption` | enum | `scram-sha-256` | - | user | Algorithm for passwords set in CREATE/ALTER ROLE: `scram-sha-256` or `md5` (MD5 deprecated, to be removed). |
| `scram_iterations` | integer | 4096 | - | user | SCRAM-SHA-256 iteration count; fixed at encryption time (existing passwords unaffected). Caveat: differing iteration counts let an unauthenticated user discern role existence. |
| `md5_password_warnings` | boolean | on | - | user | WARNING when CREATE/ALTER ROLE sets an MD5 password. |
| `krb_server_keyfile` | string | `FILE:/usr/local/pgsql/etc/krb5.keytab` (sysconfdir) | - | sighup | Kerberos key file; empty => system default. |
| `krb_caseins_users` | boolean | off | - | sighup | Treat GSSAPI user names case-insensitively. |
| `gss_accept_delegation` | boolean | off | - | sighup | Accept GSSAPI credentials delegated from client. |
| `oauth_validator_libraries` | string | '' (OAuth connections refused) | - | sighup (postgresql.conf only) | Library/libraries validating OAuth tokens. If exactly one, used by default; otherwise every `oauth` HBA entry must set `validator`. No validator ships with PostgreSQL (Chapter 50). |

**19.3.4 SSL** (all sighup: "postgresql.conf file or on the server command line")
| Parameter | Type | Default | Meaning / notes |
|---|---|---|---|
| `ssl` | boolean | off | Enable SSL (TLS) connections. |
| `ssl_ca_file` | string | '' (no client cert verification) | Trusted CA file; relative to data directory. |
| `ssl_cert_file` | string | `server.crt` | Server certificate. |
| `ssl_crl_file` | string | '' | Client certificate revocation list file (loaded at start/reload). |
| `ssl_crl_dir` | string | '' | CRL directory (prepare with `openssl rehash`/`c_rehash`); loaded on demand at connection time, new CRLs used immediately. |
| `ssl_key_file` | string | `server.key` | Server private key. |
| `ssl_tls13_ciphers` | string | '' (OpenSSL default suites) | Colon-separated TLS 1.3 cipher suites. |
| `ssl_ciphers` | string | `HIGH:MEDIUM:+3DES:!aNULL` | Ciphers for TLS <= 1.2. HIGH (AES, Camellia, 3DES), MEDIUM (RC4, SEED), `+3DES` reorders 3DES after other HIGH/MEDIUM, `!aNULL` disables anonymous suites (MITM-vulnerable). `openssl ciphers -v '...'` to inspect. |
| `ssl_prefer_server_ciphers` | boolean | on | Use server's cipher preference order. |
| `ssl_groups` | string | `X25519:prime256v1` | Named group(s) for TLS key exchange, colon-separated. **Before 18.0 named `ssl_ecdh_curve` and accepted a single value.** |
| `ssl_min_protocol_version` | enum | `TLSv1.2` | TLSv1, TLSv1.1, TLSv1.2, TLSv1.3; SSLv2/v3 always disabled. |
| `ssl_max_protocol_version` | enum | '' (any) | Same values plus empty string. |
| `ssl_dh_params_file` | string | '' (compiled-in DH params) | Custom DH params (`openssl dhparam -out dhparams.pem 2048`). |
| `ssl_passphrase_command` | string | '' (built-in prompt) | External command printing passphrase on stdout, exit 0; `%p` = prompt string, `%%` literal. |
| `ssl_passphrase_command_supports_reload` | boolean | off | Whether the passphrase command is also called during reload; if off, SSL config is not reloaded when a passphrase is needed. Must be on for Windows. |

### GUC 19.4 Resource Consumption  [M1, M2, M4, M7]  (source: runtime-config-resource.txt)

**19.4.1 Memory**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `shared_buffers` | integer | typically 128MB (less if kernel cannot support, per initdb) | blocks | postmaster | Shared memory buffers. Minimum 128 kB. Starting point on a dedicated server with >= 1GB RAM: **25% of RAM**; more than **40% of RAM** unlikely to help because PostgreSQL also relies on the OS cache. Larger values usually need larger `max_wal_size`. |
| `huge_pages` | enum | `try` | - | postmaster | `try` / `on` (fail to start if unavailable) / `off`. Main shared memory area only. Linux (only with shared_memory_type=mmap) and Windows ("large pages", needs "Lock pages in memory" right). Actual state in `huge_pages_status`. Transparent huge pages (THP) are discouraged. |
| `huge_page_size` | integer | 0 (system default) | kB | postmaster | Huge page size; non-default only on Linux. Common: 2MB & 1GB (Intel/AMD), 16MB & 16GB (POWER), 64kB/2MB/32MB/1GB (ARM). |
| `temp_buffers` | integer | 8MB | blocks | user (only before first use of temp tables in the session) | Max session-local buffers for temporary tables. Cost of an unused increment: a buffer descriptor, about **64 bytes**; a used buffer costs an additional 8192 bytes (BLCKSZ). |
| `max_prepared_transactions` | integer | 0 (feature disabled) | - | postmaster | Max simultaneously "prepared" transactions (PREPARE TRANSACTION). If used, set >= max_connections. Standby must be >= primary. |
| `work_mem` | integer | 4MB | kB | user | **Base max memory per query operation (sort or hash table) before spilling to temporary disk files.** Each sort/hash node in a plan, in each session (and each parallel worker), may use this much. Sorts: ORDER BY, DISTINCT, merge joins. Hash tables: hash joins, hash aggregation, memoize nodes, hash-based IN subqueries. |
| `hash_mem_multiplier` | floating point | 2.0 | - | user | Hash-operation memory limit = work_mem * hash_mem_multiplier. 2.0-8.0 or more may help when work_mem is already >= 40MB. |
| `maintenance_work_mem` | integer | 64MB | kB | user | Max memory for maintenance: VACUUM, CREATE INDEX, ALTER TABLE ADD FOREIGN KEY. Autovacuum may allocate up to autovacuum_max_workers times this. |
| `autovacuum_work_mem` | integer | -1 (use maintenance_work_mem) | kB | sighup | Max memory per autovacuum worker. |
| `vacuum_buffer_usage_limit` | integer | 2MB | kB | user ("can be set at any time") | Size of the Buffer Access Strategy ring used by VACUUM and ANALYZE. 0 = may use any number of shared buffers; otherwise 128 kB to 16 GB; silently capped at 1/8 of shared_buffers. Overridable per command with `BUFFER_USAGE_LIMIT`. |
| `logical_decoding_work_mem` | integer | 64MB | kB | user | Max memory for logical decoding before decoded changes spill to local disk; one buffer per replication connection. |
| `commit_timestamp_buffers` | integer | 0 => shared_buffers/512, up to 1024 blocks, not fewer than 16 blocks | blocks | postmaster | Cache for `pg_commit_ts`. |
| `multixact_member_buffers` | integer | 32 | blocks | postmaster | Shared memory cache for `pg_multixact/members`. |
| `multixact_offset_buffers` | integer | 16 | blocks | postmaster | Cache for `pg_multixact/offsets`. |
| `notify_buffers` | integer | 16 | blocks | postmaster | Cache for `pg_notify`. |
| `serializable_buffers` | integer | 32 | blocks | postmaster | Cache for `pg_serial`. |
| `subtransaction_buffers` | integer | 0 => shared_buffers/512, up to 1024 blocks, min 16 | blocks | postmaster | Cache for `pg_subtrans`. |
| `transaction_buffers` | integer | 0 => shared_buffers/512, up to 1024 blocks, min 16 | blocks | postmaster | Cache for `pg_xact` (the commit log / clog). |
| `max_stack_depth` | integer | 2MB | kB | superuser | Max safe execution stack depth; ideal = kernel `ulimit -s` minus ~1 MB safety margin (depth is only checked in key potentially-recursive routines). Too high => runaway recursion can crash a backend. |
| `shared_memory_type` | enum | first supported of: `mmap`, `sysv`, `windows` | - | postmaster | Implementation for the main shared memory region: `mmap` (anonymous shared memory via mmap), `sysv` (shmget; not default anywhere, discouraged), `windows`. |
| `dynamic_shared_memory_type` | enum | first supported of: `posix`, `sysv`, `windows`, `mmap` | - | postmaster | DSM implementation: `posix` (shm_open), `sysv` (shmget), `windows`, `mmap` (memory-mapped files in data directory `pg_dynshmem`; discouraged, never default). |
| `min_dynamic_shared_memory` | integer | 0 (none) | MB | postmaster | Memory preallocated at startup for parallel queries; affected by huge_pages. When exhausted, parallel queries allocate DSM from the OS via dynamic_shared_memory_type. |

**19.4.2 Disk**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `temp_file_limit` | integer | -1 (no limit) | kB | superuser | Max disk space a process may use for temporary files (sort/hash temp files, held-cursor storage) at any instant; exceeding cancels the transaction. Explicit temporary tables do NOT count. |
| `file_copy_method` | enum | `COPY` | - | user | `COPY` or `CLONE` (copy_file_range() on Linux/FreeBSD, copyfile on macOS). Affects `CREATE DATABASE ... STRATEGY=FILE_COPY` and `ALTER DATABASE ... SET TABLESPACE`. |
| `file_extend_method` | enum | `posix_fallocate` where available, else `write_zeros` | - | (not stated) | How data files are extended in bulk operations such as COPY. posix_fallocate silently falls back to write_zeros if FS lacks support; BTRFS disables compression with it. `write_zeros` always used when extending by 8 blocks or fewer. |
| `max_notify_queue_pages` | integer | 1048576 | pages | postmaster | Max pages for the NOTIFY/LISTEN queue (8 GB of disk at 8 kB pages). |

**19.4.3 Kernel Resource Usage**
| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `max_files_per_process` | integer | 1000 | postmaster | Max files each server subprocess may open simultaneously (files already open in postmaster not counted). Reduce on "Too many open files". |

**19.4.4 Background Writer** — separate process that writes dirty shared buffers when clean buffers appear insufficient, so backends rarely have to write dirty buffers themselves; increases net I/O (a repeatedly dirtied page may be written several times per checkpoint interval instead of once).
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `bgwriter_delay` | integer | 200ms | ms | sighup | Sleep between rounds; longer sleep when no dirty buffers. Effective resolution may be 10 ms. |
| `bgwriter_lru_maxpages` | integer | 100 | buffers | sighup | Max buffers written per round; 0 disables background writing (checkpoints unaffected). |
| `bgwriter_lru_multiplier` | floating point | 2.0 | - | sighup | Next-round need estimate = recent average buffer need * multiplier; write dirty buffers until that many clean reusable buffers exist (capped by lru_maxpages). 1.0 = "just in time". |
| `bgwriter_flush_after` | integer | 512kB on Linux, 0 elsewhere | blocks | sighup | After this much written by bgwriter, force OS writeback. Range 0 (disabled) to 2MB. |

**19.4.5 I/O**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `backend_flush_after` | integer | 0 (disabled) | blocks | user | After this much written by one backend, force OS writeback. Range 0-2MB. |
| `effective_io_concurrency` | integer | **16** | - | user | Number of concurrent storage I/O operations expected; range 1-1000, 0 disables asynchronous I/O requests. Also controls prefetch distance on systems with prefetch advice. Overridable per tablespace (ALTER TABLESPACE). |
| `maintenance_io_concurrency` | integer | 16 | - | user | Same, for maintenance work done on behalf of many sessions; per-tablespace override. |
| `io_max_combine_limit` | integer | 128kB | blocks | postmaster | Hard cap on combined-I/O size; silently limits `io_combine_limit`. Max typically 1MB on Unix, 128kB on Windows. |
| `io_combine_limit` | integer | 128kB | blocks | user | Largest I/O size in operations that combine I/O. |
| `io_max_concurrency` | integer | -1 (auto from shared_buffers and max processes: max_connections, autovacuum_worker_slots, max_worker_processes, max_wal_senders; not more than 64) | - | postmaster | Max I/O operations one process can execute simultaneously. |
| `io_method` | enum | `worker` | - | postmaster | **Asynchronous I/O method (PG 18):** `worker` (I/O worker processes), `io_uring` (needs `--with-liburing`), `sync` (execute AIO-eligible I/O synchronously). |
| `io_workers` | integer | 3 | - | sighup | Number of I/O worker processes (only with io_method=worker). |

**19.4.6 Worker Processes**
| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `max_worker_processes` | integer | 8 | postmaster | Max background processes the cluster supports. Standby must be >= primary. |
| `max_parallel_workers_per_gather` | integer | 2 | user | Max workers started by one Gather / Gather Merge node; 0 disables parallel query. Workers come from max_worker_processes pool, limited by max_parallel_workers; may get fewer at run time. work_mem applies per worker: 4 workers => up to 5x the resources. |
| `max_parallel_maintenance_workers` | integer | 2 | user | Max parallel workers for one utility command: CREATE INDEX for **B-tree, GIN, or BRIN**, and VACUUM without FULL. 0 disables. maintenance_work_mem is a limit for the entire utility command regardless of worker count. |
| `max_parallel_workers` | integer | 8 | user | Max workers for parallel operations cluster-wide; values above max_worker_processes have no effect. |
| `parallel_leader_participation` | boolean | on | user | Leader also executes the plan under Gather/Gather Merge instead of only waiting for workers. |

### GUC 19.5 Write Ahead Log  [M7]  (source: runtime-config-wal.txt)

**19.5.1 Settings**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `wal_level` | enum | `replica` | - | postmaster | How much information goes to WAL: `minimal` (only crash/immediate-shutdown recovery info) < `replica` (archiving + replication + read-only standby queries) < `logical` (adds logical decoding info). Each level includes lower ones. Old values `archive` and `hot_standby` (pre-9.6) map to `replica`. |
| `fsync` | boolean | on | - | sighup | Force updates physically to disk via fsync() or equivalent (see wal_sync_method). Off => risk of unrecoverable corruption after OS/hardware crash. If turned off also consider turning off full_page_writes. |
| `synchronous_commit` | enum | `on` | - | user (per-transaction, `SET LOCAL`) | How much WAL processing must complete before "success" is returned: `remote_apply`, `on`, `remote_write`, `local`, `off`. |
| `wal_sync_method` | enum | first supported in list order, except `fdatasync` on Linux and FreeBSD | - | sighup | `open_datasync` (open() O_DSYNC), `fdatasync` (fdatasync() at each commit), `fsync`, `fsync_writethrough` (fsync forcing write-through of disk write cache), `open_sync` (O_SYNC). Irrelevant if fsync is off. |
| `full_page_writes` | boolean | on | - | sighup | Write entire page content to WAL on the first modification of that page after a checkpoint (torn-page protection). |
| `wal_log_hints` | boolean | off | - | postmaster | Also write full page on first post-checkpoint modification even for hint-bit-only changes. Ignored (always logged) when data checksums are enabled. Useful to measure the extra WAL checksums would cause. |
| `wal_compression` | enum | `off` | - | superuser | Compress full page images in WAL: `pglz`, `lz4` (--with-lz4), `zstd` (--with-zstd); `on` = historical spelling of pglz. |
| `wal_init_zero` | boolean | on | - | (not stated) | Zero-fill new WAL files (ensures space allocated). Off: only the final byte is written (useful on COW file systems). |
| `wal_recycle` | boolean | on | - | (not stated) | Recycle WAL files by renaming instead of creating new ones (off may be faster on COW file systems). |
| `wal_buffers` | integer | -1 => **1/32nd (about 3%) of shared_buffers, not less than 64kB nor more than one WAL segment (typically 16MB)** | WAL blocks (XLOG_BLCKSZ, typically 8kB) | postmaster | Shared memory for WAL not yet written to disk. Positive values below 32kB are treated as 32kB. WAL buffers are written out at every transaction commit. |
| `wal_writer_delay` | integer | 200ms | ms | sighup | How often WAL writer flushes WAL (time). After a flush it sleeps this long unless woken by an asynchronously committing transaction. |
| `wal_writer_flush_after` | integer | 1MB | WAL blocks | sighup | Flush by volume: if last flush < wal_writer_delay ago AND < this much WAL produced since, WAL is only written to OS, not flushed. 0 => always flush immediately. |
| `wal_skip_threshold` | integer | 2MB | kB | (not stated) | With wal_level=minimal, at commit after creating/rewriting a permanent relation: data smaller than this is written to WAL; otherwise the affected files are fsynced. |
| `commit_delay` | integer | 0 | microseconds | superuser | Delay before a WAL flush is initiated (group commit). Only applied if at least `commit_siblings` other transactions are active; never if fsync is off. Since 9.3: first process ready to flush waits the interval, later ones wait only until the leader finishes. |
| `commit_siblings` | integer | 5 | transactions | user | Min concurrent open transactions required to perform the commit_delay. |

**synchronous_commit semantics**
- With empty `synchronous_standby_names`, only `on` and `off` are meaningful (`remote_apply`, `remote_write`, `local` behave like `on`). All non-off modes wait for local WAL flush.
- `off`: no waiting; window between success report and crash-safety is at most **three times `wal_writer_delay`**. "Unlike fsync, setting this parameter to off does not create any risk of database inconsistency": recent allegedly-committed transactions may be lost, but the state is as if they aborted cleanly.
- Table 19.1:
  | setting | local durable commit | standby durable commit after PG crash | standby durable commit after OS crash | standby query consistency |
  |---|---|---|---|---|
  | remote_apply | yes | yes | yes | yes |
  | on | yes | yes | yes | no |
  | remote_write | yes | yes | no | no |
  | local | yes | no | no | no |
  | off | no | no | no | no |
- `remote_apply`: wait until sync standby(s) have received, flushed AND applied (visible to standby queries). `on`: received and flushed to durable storage on standby. `remote_write`: received and written to standby's file system (survives standby PG crash, not standby OS crash). `local`: local flush only.
- Per-transaction: `SET LOCAL synchronous_commit TO OFF` inside the transaction; behaviour is determined by the setting in effect at commit.

**wal_level = minimal details**: logs no row information for permanent relations in transactions that create or rewrite them. Operations that trigger the optimization: `ALTER ... SET TABLESPACE`, `CLUSTER`, `CREATE TABLE`, `REFRESH MATERIALIZED VIEW` (without CONCURRENTLY), `REINDEX`, `TRUNCATE`. Not enough for PITR; server will not start with minimal if `max_wal_senders` is non-zero; switching to minimal makes previous base backups unusable for PITR and standbys. `logical` increases WAL volume, especially with many `REPLICA IDENTITY FULL` tables and many UPDATE/DELETE.

**fsync details**: safe to turn off only if the whole database can be recreated (initial load from backup, throwaway batch cluster, frequently recreated read-only clone not used for failover). "High quality hardware alone is not a sufficient justification." Turning fsync back on requires flushing kernel buffers: `initdb --sync-only`, `sync`, unmount, or reboot. `synchronous_commit=off` gives much of the benefit without corruption risk.

**full_page_writes details**: a page write in progress during an OS crash might be only partially completed (mix of old and new data); row-level WAL is not enough to restore such a page; the full page image guarantees correct restore. WAL replay always starts from a checkpoint so only the first change after each checkpoint needs it => increasing checkpoint interval reduces FPW cost. Turning off risks unrecoverable or silent corruption. Does not affect PITR archiving.

**19.5.2 Checkpoints**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `checkpoint_timeout` | integer | 5min | s | sighup | Max time between automatic WAL checkpoints. Range 30 seconds to one day. Larger => longer crash recovery. |
| `checkpoint_completion_target` | floating point | 0.9 | fraction | sighup | Target for checkpoint completion as a fraction of the time between checkpoints; spreads I/O. Reducing not recommended. |
| `checkpoint_flush_after` | integer | 256kB on Linux, 0 elsewhere | blocks | sighup | Force OS writeback after this much checkpoint data written. Range 0-2MB. |
| `checkpoint_warning` | integer | 30s | s | sighup | Log a message if checkpoints caused by WAL segment filling occur closer together than this (suggests raising max_wal_size). 0 disables; none if checkpoint_timeout < checkpoint_warning. |
| `max_wal_size` | integer | 1GB | MB | sighup | Max WAL size to allow between automatic checkpoints; **soft limit** (exceeded under heavy load, failing archive_command/archive_library, high wal_keep_size). |
| `min_wal_size` | integer | 80MB | MB | sighup | While WAL usage stays below this, old WAL files are always recycled at checkpoint rather than removed. |

**19.5.3 Archiving**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `archive_mode` | enum | `off` | - | postmaster | `off`, `on`, `always` (archiver also runs during archive recovery/standby; restored or streamed files are archived again). Cannot be enabled with wal_level=minimal. |
| `archive_command` | string | '' | - | sighup | Shell command to archive a completed WAL segment; `%p` = path of file (relative to data directory), `%f` = file name, `%%` = literal. Must return zero only on success. Empty while archive_mode on => archiving temporarily disabled, WAL accumulates. Error if both archive_command and archive_library set. `/bin/true` effectively disables archiving but breaks the WAL chain. |
| `archive_library` | string | '' | - | sighup | Shared library for archiving (Chapter 49); empty => shell archive_command. Archiver process restarted by postmaster on change. |
| `archive_timeout` | integer | (not stated; > 0 enables) | s | sighup | Force a WAL segment switch after this much time since the last switch if there was any activity (including a single checkpoint). Early-closed files are still full length (bloats archive); a minute or so is reasonable. |

**19.5.4 Recovery (general)**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `recovery_prefetch` | enum | `try` | - | (not stated) | Prefetch blocks referenced in WAL that are not yet in the buffer pool during recovery: `off`, `on`, `try` (only if OS supports read-ahead advice). Limited by wal_decode_buffer_size and maintenance_io_concurrency. |
| `wal_decode_buffer_size` | integer | 512kB | bytes | postmaster | How far ahead in WAL the server can look to find blocks to prefetch. |

**19.5.5 Archive Recovery** (apply only for the duration of recovery)
- Standby mode: create file **`standby.signal`** in the data directory; server enters recovery and does not stop at end of archived WAL, keeps trying via `primary_conninfo` and/or `restore_command`.
- Targeted recovery mode: create **`recovery.signal`**; ends when archived WAL fully replayed or `recovery_target` reached. If both files exist, standby mode takes precedence.
| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `restore_command` | string | '' | sighup | Shell command to fetch an archived WAL segment. `%f` file name, `%p` destination path (relative to data dir), `%r` file containing the last valid restart point, `%%`. Required for archive recovery, optional for streaming. Must return nonzero for files not in the archive. Killed by signal (other than SIGTERM) or shell error => recovery aborts, server will not start. Example `restore_command = 'cp /mnt/server/archivedir/%f "%p"'`. |
| `archive_cleanup_command` | string | '' | sighup | Shell command run at every restartpoint to remove no-longer-needed archived WAL; `%r`. Example `archive_cleanup_command = 'pg_archivecleanup /mnt/server/archivedir %r'`. Nonzero exit => warning; signal/shell error => fatal. |
| `recovery_end_command` | string | '' | sighup | Shell command run once at end of recovery; `%r`. Nonzero => warning, startup proceeds; signal/shell error => no startup. |

**19.5.6 Recovery Target** (all postmaster; at most one of the five target parameters, else error)
| Parameter | Type | Default | Meaning / notes |
|---|---|---|---|
| `recovery_target` | string | '' | Only allowed value `'immediate'`: end recovery as soon as a consistent state is reached (end of the online backup). |
| `recovery_target_name` | string | '' | Named restore point created with `pg_create_restore_point()`. |
| `recovery_target_time` | timestamp | '' | Timestamp (timestamptz format; no tz abbreviations unless timezone_abbreviations set earlier; prefer numeric UTC offset or full zone name). |
| `recovery_target_xid` | string | '' | Transaction ID; transactions that committed before (and optionally including) it are recovered. XIDs are assigned at start but complete in a different order. |
| `recovery_target_lsn` | pg_lsn | '' | WAL location (LSN). |
| `recovery_target_inclusive` | boolean | on | Stop just after (on) or just before (off) the target; applies to lsn/time/xid. |
| `recovery_target_timeline` | string | `latest` | Numeric timeline ID (hex with `0x`; WAL file `00000011000000A10000004F` => timeline 0x11 = 17), `current` (timeline current when base backup was taken), or `latest` (latest timeline in archive). |
| `recovery_target_action` | enum | `pause` | `pause` (resume with `pg_wal_replay_resume()`), `promote`, `shutdown` (recovery.signal is not removed, so subsequent starts shut down immediately until config changed or file removed). No effect without a target. If hot_standby is off, pause acts like shutdown. If archive recovery ends before the target is reached, server shuts down with a fatal error. |

**19.5.7 WAL Summarization** (needed for incremental backup)
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `summarize_wal` | boolean | off | - | sighup | Enables the WAL summarizer process (primary or standby). Cannot start with wal_level=minimal. |
| `wal_summary_keep_time` | integer | 10 days | min | sighup | Age after which WAL summaries are auto-removed (by file timestamp); 0 = never. |

### GUC 19.6 Replication  [M7]  (source: runtime-config-replication.txt)

- Streaming replication: primary sends, standbys receive; with cascading replication standbys also send. Logical replication: publishers ("senders") -> subscribers.

**19.6.1 Sending Servers**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `max_wal_senders` | integer | 10 | - | postmaster | Max concurrent WAL sender processes (standbys + streaming base backup clients). 0 disables replication. Needs wal_level >= replica. Standby must be >= primary. |
| `max_replication_slots` | integer | 10 | - | postmaster | Max replication slots. Lower than existing slot count prevents startup. Needs wal_level >= replica. |
| `output_plugin_libraries` | string | `'pgoutput, test_decoding'` | - | (reload; hint says "reload the server configuration") | Libraries in dynamic_library_path trusted as logical output plugins; requests for other libraries are refused (`ERROR: library "..." may not be used as an output plugin`). Applies to all users. Plugin name must match a list entry exactly. Table 19.2: `pgoutput` = core plugin for logical replication (removing it breaks subscription connections and slot maintenance); `test_decoding` = human-readable text decoding, default for `pg_recvlogical`. Helper: `SELECT DISTINCT plugin FROM pg_replication_slots WHERE plugin IS NOT NULL;` |
| `wal_keep_size` | integer | 0 | MB | sighup | Minimum size of past WAL kept in `pg_wal` for standbys. If a standby falls behind by more, the needed segment may be removed and the replication connection terminated (recoverable from archive). |
| `max_slot_wal_keep_size` | integer | -1 (unlimited) | MB | sighup | Max WAL that replication slots may retain in pg_wal at checkpoint time; if a slot's `restart_lsn` falls behind current LSN by more, the slot's standby may be unable to continue. See `pg_replication_slots`. |
| `idle_replication_slot_timeout` | integer | 0 (disabled) | s | sighup | Invalidate slots inactive longer than this; invalidation happens at checkpoint; uses `pg_replication_slots.inactive_since`. Not applicable to slots that do not reserve WAL or synced standby slots (`synced` = true). |
| `wal_sender_timeout` | integer | 60s | ms | user | Terminate replication connections inactive longer than this (detect standby crash/network outage). 0 disables. |
| `track_commit_timestamp` | boolean | off | - | postmaster | Record commit time of transactions. |

**19.6.2 Primary Server**
| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `synchronous_standby_names` | string | '' (sync replication disabled) | sighup | List of standbys that can be synchronous. Syntaxes: `[FIRST] num_sync ( standby_name [, ...] )` (priority-based; earlier names have higher priority; others are potential sync standbys; a disconnected sync standby is replaced immediately by the next-highest priority), `ANY num_sync ( standby_name [, ...] )` (quorum-based: commit proceeds once any num_sync reply), `standby_name [, ...]` (pre-9.6; = `FIRST 1 (...)`). `*` matches any name. Standby name = standby's `application_name` (physical: from primary_conninfo, default cluster_name else `walreceiver`; logical: subscription name). Compared case-insensitively. Only standbys in state `streaming` in `pg_stat_replication` count. |
| `synchronized_standby_slots` | string | '' | (not stated) | Comma-separated physical standby slot names that logical WAL senders wait for before sending decoded changes to plugins (so logical failover slots never get ahead of the physical standbys). Logical replication stalls if listed slots do not exist/are invalidated. `pg_replication_slot_advance`, `pg_logical_slot_get_changes`, `pg_logical_slot_peek_changes` on failover slots also block. Those standbys must set `sync_replication_slots = true`. |

**19.6.3 Standby Servers**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `primary_conninfo` | string | '' | - | sighup | Connection string to the sending server (libpq format). Password may come from `~/.pgpass` (database name `replication`). A `dbname` is needed for replication slot synchronization only. Changing it restarts the WAL receiver. |
| `primary_slot_name` | string | '' | - | sighup | Existing replication slot to use on the sender. Change restarts WAL receiver. |
| `hot_standby` | boolean | on | - | postmaster | Allow connections and queries during recovery. |
| `max_standby_archive_delay` | integer | 30s | ms | sighup | How long standby waits before cancelling queries conflicting with WAL to apply, when WAL is read from archive. -1 = wait forever. It is the max total time to apply any one WAL segment's data, not a per-query grace. |
| `max_standby_streaming_delay` | integer | 30s | ms | sighup | Same for WAL received via streaming: max total time to apply WAL once received. -1 = forever. |
| `wal_receiver_create_temp_slot` | boolean | off | - | sighup | WAL receiver creates a temporary slot on the remote when no primary_slot_name. |
| `wal_receiver_status_interval` | integer | 10s | s | sighup | Max time between WAL receiver progress reports (written, flushed, applied positions) to the upstream (`pg_stat_replication`). |
| `hot_standby_feedback` | boolean | off | - | sighup | Standby sends feedback about its running queries to the primary; eliminates query cancels due to cleanup records but can cause bloat on the primary. Not more often than once per wal_receiver_status_interval; passed upstream in cascades. Timestamp-based (clock jumps can break it). |
| `wal_receiver_timeout` | integer | 60s | ms | sighup | Terminate inactive replication connections (detect primary crash/outage). 0 disables. |
| `wal_retrieve_retry_interval` | integer | 5s | ms | sighup | Wait before retrying when WAL is unavailable from any source (streaming, pg_wal, archive). Also limits respawn rate of failing logical apply/tablesync workers. |
| `recovery_min_apply_delay` | integer | 0 | ms | sighup | Delayed standby: replay each commit only when standby system time >= primary commit time + delay. Delay applies only to commit records (other records replayed ASAP; MVCC hides them until the commit record is applied). Starts once consistent state reached; ends on promotion. With `synchronous_commit=remote_apply` every COMMIT waits. Delays hot_standby_feedback. |
| `sync_replication_slots` | boolean | off | - | sighup | Physical standby synchronizes logical failover slots from the primary so subscribers can resume after failover. |

**19.6.4 Subscribers**
| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `max_active_replication_origins` | integer | 10 | postmaster | How many replication origins can be tracked simultaneously (limits subscriptions; at least number of subscriptions plus reserve for table sync). Lower than current tracked (`pg_replication_origin_status`) prevents startup. |
| `max_logical_replication_workers` | integer | 4 | postmaster | Max logical replication workers (leader apply, parallel apply, table sync); taken from max_worker_processes. |
| `max_sync_workers_per_subscription` | integer | 2 | sighup | Max table synchronization workers per subscription (initial copy parallelism); one sync worker per table; from max_logical_replication_workers pool. |
| `max_parallel_apply_workers_per_subscription` | integer | 2 | sighup | Max parallel apply workers per subscription (for `streaming = parallel`). |

### GUC 19.7 Query Planning  [M4]  (source: runtime-config-query.txt)

All parameters in 19.7 carry no documented context restriction (user-settable per session).

**19.7.1 Planner Method Configuration** — "a crude method of influencing the query plans". Better levers: cost constants, manual `ANALYZE`, `default_statistics_target`, `ALTER TABLE SET STATISTICS`. Complete list of 24 flags:
| Parameter | Default | What it enables / notes |
|---|---|---|
| `enable_async_append` | on | async-aware Append plan types |
| `enable_bitmapscan` | on | bitmap-scan plan types |
| `enable_distinct_reordering` | on | reordering DISTINCT keys to match the input path's pathkeys |
| `enable_gathermerge` | on | Gather Merge plan types |
| `enable_group_by_reordering` | on | GROUP BY keys sorted in the order of a child node's keys (e.g. index scan); off => only sorted to match ORDER BY |
| `enable_hashagg` | on | hashed aggregation |
| `enable_hashjoin` | on | hash joins |
| `enable_incremental_sort` | on | incremental sort steps |
| `enable_indexscan` | on | index-scan AND index-only-scan plan types |
| `enable_indexonlyscan` | on | index-only scans (enable_indexscan must also be on) |
| `enable_material` | on | materialization; cannot be suppressed entirely (off = only where required for correctness) |
| `enable_memoize` | on | Memoize: cache results of parameterized scans inside nested-loop joins; less-used entries evicted when space needed |
| `enable_mergejoin` | on | merge joins |
| `enable_nestloop` | on | nested-loop joins; cannot be suppressed entirely, off only discourages |
| `enable_parallel_append` | on | parallel-aware Append |
| `enable_parallel_hash` | on | hash joins with parallel hash (no effect unless hash joins enabled) |
| `enable_partition_pruning` | on | plan-time partition elimination AND plans that let the executor prune partitions at run time |
| `enable_partitionwise_join` | **off** | join partitioned tables by joining matching partitions; requires join conditions including all partition keys, same data type, one-to-one matching child partitions. Multiplies work_mem-limited nodes by partition count; planning much costlier. |
| `enable_partitionwise_aggregate` | **off** | per-partition grouping/aggregation; if GROUP BY lacks the partition keys only partial aggregation per partition, finalize later. Same memory/planning caveats. |
| `enable_presorted_aggregate` | on | provide input presorted for ORDER BY / DISTINCT aggregates instead of always sorting in the executor |
| `enable_self_join_elimination` | on | replace self joins with semantically equivalent single scans (plain tables only) |
| `enable_seqscan` | on | sequential scans; cannot be suppressed entirely, off only discourages |
| `enable_sort` | on | explicit sort steps; cannot be suppressed entirely |
| `enable_tidscan` | on | TID scan plan types |

(Count check: async_append, bitmapscan, distinct_reordering, gathermerge, group_by_reordering, hashagg, hashjoin, incremental_sort, indexscan, indexonlyscan, material, memoize, mergejoin, nestloop, parallel_append, parallel_hash, partition_pruning, partitionwise_join, partitionwise_aggregate, presorted_aggregate, self_join_elimination, seqscan, sort, tidscan = 24 flags; only the two partitionwise flags default off.)

**19.7.2 Planner Cost Constants** — arbitrary scale, only relative values matter; convention: `seq_page_cost = 1.0` is the unit. No well-defined method to find ideal values; treat as averages over the whole query mix; changing on a few experiments "is very risky".
| Parameter | Type | Default | Unit | Meaning / notes |
|---|---|---|---|---|
| `seq_page_cost` | float | **1.0** | cost | Disk page fetch that is part of a series of sequential fetches. Per-tablespace override (ALTER TABLESPACE). |
| `random_page_cost` | float | **4.0** | cost | Non-sequentially-fetched disk page. Per-tablespace override. Lower => prefers index scans. Real random access is much more than 4x sequential, but 4.0 assumes most random accesses (indexed reads) hit cache. Setting below seq_page_cost is "not physically sensible"; equal makes sense for a fully RAM-cached database; heavily cached => lower both relative to CPU costs. |
| `cpu_tuple_cost` | float | **0.01** | cost | Processing each row. |
| `cpu_index_tuple_cost` | float | **0.005** | cost | Processing each index entry during an index scan. |
| `cpu_operator_cost` | float | **0.0025** | cost | Processing each operator or function executed. |
| `parallel_setup_cost` | float | **1000** | cost | Launching parallel worker processes. |
| `parallel_tuple_cost` | float | **0.1** | cost | Transferring one tuple from a parallel worker to another process. |
| `min_parallel_table_scan_size` | integer | 8MB | blocks | Min table data to be scanned for a parallel scan to be considered. |
| `min_parallel_index_scan_size` | integer | 512kB | blocks | Min index data (pages the planner believes will be touched) for a parallel index scan; also decides whether an index can participate in parallel VACUUM. |
| `effective_cache_size` | integer | 4GB | blocks | Planner's assumption of disk cache available to a single query (shared buffers + kernel cache for PG files). Higher => index scans more likely. Estimation only: allocates nothing, reserves nothing. |
| `jit_above_cost` | float | 100000 | cost | Query cost above which JIT compilation is activated; -1 disables JIT. |
| `jit_inline_above_cost` | float | 500000 | cost | Cost above which JIT inlines functions/operators; -1 disables inlining; not meaningful below jit_above_cost. |
| `jit_optimize_above_cost` | float | 500000 | cost | Cost above which JIT applies expensive optimizations; -1 disables. |

**19.7.3 Genetic Query Optimizer (GEQO)** — heuristic search for join planning of many-relation queries; less planning time, sometimes inferior plans (Chapter 61).
| Parameter | Type | Default | Meaning / notes |
|---|---|---|---|
| `geqo` | boolean | on | Enable GEQO. |
| `geqo_threshold` | integer | 12 | Use GEQO for queries with at least this many FROM items (a FULL OUTER JOIN construct counts as one). |
| `geqo_effort` | integer | 5 | Range 1-10; only used to compute defaults of the other GEQO variables. |
| `geqo_pool_size` | integer | 0 (auto from geqo_effort and number of tables) | Individuals in the genetic population; at least 2, useful 100-1000. |
| `geqo_generations` | integer | 0 (auto from geqo_pool_size) | Number of iterations; at least 1. |
| `geqo_selection_bias` | float | 2.00 | Selective pressure; range 1.50-2.00. |
| `geqo_seed` | float | 0 | Initial random seed, range 0-1; changes the set of join paths explored. |

**19.7.4 Other Planner Options**
| Parameter | Type | Default | Meaning / notes |
|---|---|---|---|
| `default_statistics_target` | integer | 100 | Default statistics target for columns without `ALTER TABLE SET STATISTICS`. Larger => slower ANALYZE, better estimates. |
| `constraint_exclusion` | enum | `partition` | `on` (all tables), `off`, `partition` (only inheritance child tables and UNION ALL subqueries). Planner compares query conditions with CHECK constraints and skips contradicted tables. Example: `CREATE TABLE child1000(check (key between 1000 and 1999)) INHERITS(parent); ... SELECT * FROM parent WHERE key = 2400;` skips child1000. Declarative partitioning uses `enable_partition_pruning` instead. |
| `cursor_tuple_fraction` | float | 0.1 | Estimated fraction of a cursor's rows that will be fetched; small => "fast start" plans; 1.0 => planned like regular queries. |
| `from_collapse_limit` | integer | 8 | Merge sub-queries into upper query if resulting FROM list has no more than this many items. Setting >= geqo_threshold may trigger GEQO. |
| `jit` | boolean | on | Whether JIT compilation may be used, if available. |
| `join_collapse_limit` | integer | 8 (same as from_collapse_limit) | Rewrite explicit JOINs (except FULL JOINs) into FROM lists of no more than this many items. **1 = no reordering: explicit join order is the actual join order.** |
| `plan_cache_mode` | enum | `auto` | `auto`, `force_custom_plan`, `force_generic_plan`. Custom plan = replanned per execution with parameter values; generic plan = reused. Considered when a cached plan is executed, not when prepared. |
| `recursive_worktable_factor` | float | 10.0 | Estimated average size of a recursive query's working table as a multiple of the non-recursive term's estimated size. 1.0 for low fan-out (shortest path); larger for graph analytics. |

### GUC 19.8 Error Reporting and Logging  [M7]  (source: runtime-config-logging.txt)

**19.8.1 Where to Log**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `log_destination` | string | `stderr` | - | sighup | Comma-separated: `stderr`, `csvlog`, `jsonlog`, `syslog`, (Windows) `eventlog`. csvlog/jsonlog need logging_collector. File `current_logfiles` records the files in use (e.g. `stderr log/postgresql.log`). |
| `logging_collector` | boolean | off | - | postmaster | Background process capturing stderr into log files. Designed never to drop messages (backends may block under extreme load; syslog instead drops). No durability guarantee. |
| `log_directory` | string | `log` | - | sighup | Directory for log files (absolute or relative to data dir). |
| `log_filename` | string | `postgresql-%Y-%m-%d_%H%M%S.log` | strftime pattern | sighup | File name pattern; `.csv` / `.json` replace a trailing `.log` for those formats. |
| `log_file_mode` | integer | 0600 | chmod mode | sighup | Log file permissions (0640 for group read). |
| `log_rotation_age` | integer | 24h | min | sighup | Max lifetime of a log file; 0 disables time-based rotation. |
| `log_rotation_size` | integer | 10MB | kB | sighup | Max log file size; 0 disables size-based rotation. |
| `log_truncate_on_rotation` | boolean | off | - | sighup | Truncate rather than append on time-based rotation only (not startup or size-based). Example 7-day ring: log_filename `server_log.%a`, truncate on, age 1440. |
| `syslog_facility` | enum | `LOCAL0` | - | sighup | LOCAL0..LOCAL7. |
| `syslog_ident` | string | `postgres` | - | sighup | Program name in syslog. |
| `syslog_sequence_numbers` | boolean | on | - | sighup | Prefix each message with increasing sequence number (defeats "last message repeated N times"). |
| `syslog_split_messages` | boolean | on | - | sighup | Split messages by lines and to fit 1024 bytes. |
| `event_source` | string | `PostgreSQL` | - | postmaster | Windows event log source name. |

**19.8.2 When to Log**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `log_min_messages` | enum | `WARNING` | - | superuser | Levels in order: DEBUG5, DEBUG4, DEBUG3, DEBUG2, DEBUG1, INFO, NOTICE, WARNING, ERROR, LOG, FATAL, PANIC (each includes all that follow). **LOG ranks differently here than in client_min_messages.** |
| `log_min_error_statement` | enum | `ERROR` | - | superuser | Log the SQL statement for messages of this severity or higher; PANIC effectively disables. |
| `log_min_duration_statement` | integer | -1 (disabled) | ms | superuser | Log duration (and text) of statements running at least this long; 0 logs all. Overrides log_min_duration_sample. With extended protocol, Parse/Bind/Execute durations logged independently. |
| `log_min_duration_sample` | integer | -1 (disabled) | ms | superuser | Statements at least this long are candidates for sampled logging. |
| `log_statement_sample_rate` | float | 1.0 | fraction | superuser | Fraction of statements exceeding log_min_duration_sample that are logged. |
| `log_transaction_sample_rate` | float | 0 | fraction | superuser | Fraction of transactions whose statements are ALL logged, regardless of duration. |
| `log_startup_progress_interval` | integer | 10s | ms | sighup | Startup process logs a message about a long-running operation after this time and at this interval; 0 disables. |

**Table 19.3 Message severity levels**
| Severity | Usage | syslog | eventlog |
|---|---|---|---|
| DEBUG1 .. DEBUG5 | Successively more detailed information for developers | DEBUG | INFORMATION |
| INFO | Information implicitly requested by the user, e.g. VACUUM VERBOSE output | INFO | INFORMATION |
| NOTICE | Information that might be helpful to users, e.g. truncation of long identifiers | NOTICE | INFORMATION |
| WARNING | Warnings of likely problems, e.g. COMMIT outside a transaction block | NOTICE | WARNING |
| ERROR | An error that caused the current command to abort | WARNING | ERROR |
| LOG | Information of interest to administrators, e.g. checkpoint activity | INFO | INFORMATION |
| FATAL | An error that caused the current session to abort | ERR | ERROR |
| PANIC | An error that caused all database sessions to abort | CRIT | ERROR |

**19.8.3 What to Log**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `application_name` | string | '' | - | user | Any string of less than NAMEDATALEN chars (64 in a standard build => max 63); shown in `pg_stat_activity`, CSV logs, `%a`. Printable ASCII only. |
| `debug_print_parse` | boolean | off | - | user | Print the parse tree of each query at LOG level. |
| `debug_print_rewritten` | boolean | off | - | user | Print the query rewriter output. |
| `debug_print_plan` | boolean | off | - | user | Print the execution plan. |
| `debug_pretty_print` | boolean | on | - | user | Indent the above output. |
| `log_autovacuum_min_duration` | integer | 10min | ms | sighup (per-table override via storage parameter) | Log autovacuum actions running at least this long; 0 = all; -1 = disabled. Any value other than -1 also logs skips due to conflicting lock or concurrently dropped relation. |
| `log_checkpoints` | boolean | **on** | - | sighup | Log checkpoints and restartpoints with statistics (buffers written, write time). |
| `log_connections` | string | '' (disabled) | - | sb-backend (session start only) | Comma-separated list of aspects (Table 19.4): `receipt`, `authentication`, `authorization`, `setup_durations` (total setup, fork time, authentication time), `all`. Legacy booleans still accepted; positive = receipt, authentication, authorization. Failed authentication is always logged. |
| `log_disconnections` | boolean | off | - | sb-backend | Log session termination with session duration. |
| `log_duration` | boolean | off | - | superuser | Log duration of every completed statement (without query text, unlike log_min_duration_statement=0). |
| `log_error_verbosity` | enum | `DEFAULT` | - | superuser | `TERSE` (no DETAIL, HINT, QUERY, CONTEXT), `DEFAULT`, `VERBOSE` (adds SQLSTATE, source file, function, line). |
| `log_hostname` | boolean | off | - | sighup | Also log host name of connecting host (DNS cost). |
| `log_line_prefix` | string | `'%m [%p] '` | printf-style | sighup | Prefix for stderr/syslog/eventlog lines. |
| `log_lock_waits` | boolean | off | - | superuser | Log when a session waits longer than `deadlock_timeout` for a lock. |
| `log_lock_failures` | boolean | off | - | superuser | Detailed log when a lock acquisition fails; currently only failures due to `SELECT NOWAIT`. (New in 18.) |
| `log_recovery_conflict_waits` | boolean | off | - | sighup | Log when the startup process waits longer than deadlock_timeout for recovery conflicts. |
| `log_parameter_max_length` | integer | -1 (full) | bytes | superuser | Trim bind parameter values logged with non-error statement logs; 0 disables logging them. |
| `log_parameter_max_length_on_error` | integer | 0 (disabled) | bytes | user | Trim bind parameter values in error messages; -1 = full. Adds overhead (text copies stored at statement start). |
| `log_statement` | enum | `none` | - | superuser | `none`, `ddl` (CREATE/ALTER/DROP), `mod` (ddl + INSERT, UPDATE, DELETE, TRUNCATE, COPY FROM), `all`. Statements with simple syntax errors are not logged even with `all`. May reveal plaintext passwords. |
| `log_replication_commands` | boolean | off | - | superuser | Log each replication command and walsender slot acquisition/release. |
| `log_temp_files` | integer | -1 (disabled) | kB | superuser | Log each temp file (sorts, hashes, temp query results) name and size (bytes) when deleted, if size >= this; 0 = all. **The way to observe work_mem spills.** |
| `log_timezone` | string | GMT built-in (initdb writes the system zone) | - | sighup | Time zone for log timestamps; cluster-wide. |

**log_line_prefix escapes** (session-only ones are empty in background processes): `%a` application name (session), `%u` user name (session), `%d` database name (session), `%r` remote host/IP and port (session), `%h` remote host/IP (session), `%L` local address the client connected to (session), `%b` backend type, `%p` process ID, `%P` PID of parallel group leader, `%t` timestamp without ms, `%m` timestamp with ms, `%n` timestamp with ms as Unix epoch, `%i` command tag (session), `%e` SQLSTATE, `%c` session ID, `%l` log line number per session/process starting at 1, `%s` process start timestamp, `%v` virtual transaction ID (procNumber/localXID), `%x` transaction ID (0 if none assigned), `%q` no output; non-session processes stop here, `%Q` query identifier (0 unless compute_query_id enabled; always 0 for log_statement lines) (session), `%%` literal %. Padding: number after `%` (negative pads right, positive pads left). `%c` = two 4-byte hex numbers (process start time, PID) separated by a dot: `SELECT to_hex(trunc(EXTRACT(EPOCH FROM backend_start))::integer) || '.' || to_hex(pid) FROM pg_stat_activity;`. Example: `log_line_prefix = '%m [%p] %q%u@%d/%a '`.

**csvlog columns (in order)**: log_time timestamp(3) with time zone, user_name, database_name, process_id, connection_from (host:port), session_id, session_line_num, command_tag, session_start_time, virtual_transaction_id, transaction_id, error_severity, sql_state_code, message, detail, hint, internal_query, internal_query_pos, context, query, query_pos, location, application_name, backend_type, leader_pid, query_id; suggested `PRIMARY KEY (session_id, session_line_num)`. Import: `COPY postgres_log FROM '/full/path/to/logfile.csv' WITH csv;` or via `file_fdw`. For predictable imports: fixed log_filename/log_rotation_age, log_rotation_size = 0, log_truncate_on_rotation = on.

**jsonlog keys (Table 19.5)**: timestamp (string), user, dbname, pid (number), remote_host, remote_port (number), session_id, line_num (number), ps, session_start, vxid, txid, error_severity, state_code, message, detail, hint, internal_query, internal_position (number), context, statement, cursor_position (number), func_name, file_name, file_line_num (number), application_name, backend_type, leader_pid (number), query_id (number). Null string fields are omitted; consumers should ignore unknown fields.

**19.8.6 Process Title**
| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `cluster_name` | string | '' | postmaster | Name shown in the process title of all server processes; default application_name for a standby connection. Less than NAMEDATALEN (64) chars, printable ASCII. |
| `update_process_title` | boolean | on (off on Windows) | superuser | Update process title each time a new SQL command is received. |

### GUC 19.9 Run-time Statistics  [M7, M4]  (source: runtime-config-statistics.txt)

Data is exposed through the `pg_stat` and `pg_statio` view families (Chapter 27).
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `track_activities` | boolean | on | - | superuser | Collect each session's currently executing command, its identifier and start time. Visible only to superusers, roles with `pg_read_all_stats`, and the session owner. |
| `track_activity_query_size` | integer | 1024 | bytes | postmaster | Memory reserved per session for `pg_stat_activity.query` text. |
| `track_counts` | boolean | on | - | superuser | Collect statistics on database activity; **required by autovacuum**. |
| `track_cost_delay_timing` | boolean | off | - | superuser | Time cost-based vacuum delay; shown in `pg_stat_progress_vacuum`, `pg_stat_progress_analyze`, VACUUM/ANALYZE VERBOSE, autovacuum logs. (New in 18.) |
| `track_io_timing` | boolean | off | - | superuser | Time database I/O waits; shown in `pg_stat_database`, `pg_stat_io` (object not wal), `pg_stat_get_backend_io()`, `EXPLAIN (BUFFERS)`, VACUUM VERBOSE, autovacuum logs, pg_stat_statements. Overhead from clock reads: measure with `pg_test_timing`. |
| `track_wal_io_timing` | boolean | off | - | superuser | Time WAL I/O waits; shown in `pg_stat_io` for object `wal` and `pg_stat_get_backend_io()`. |
| `track_functions` | enum | `none` | - | superuser | `none`, `pl` (procedural-language functions only), `all` (also SQL and C). Inlined SQL functions are never tracked. |
| `stats_fetch_consistency` | enum | `cache` | - | user | Behaviour for repeated stats access within a transaction: `none` (re-fetch from shared memory each time; best for monitoring), `cache` (first access to an object's stats caches it until end of transaction), `snapshot` (first access caches all stats of current database). `pg_stat_clear_snapshot()` discards; changing the setting in a transaction discards the snapshot. |
| `compute_query_id` | enum | `auto` | - | (not stated) | In-core query identifier computation: `off`, `on`, `auto` (modules such as pg_stat_statements enable it), `regress` (like auto but not shown in EXPLAIN). Query id appears in `pg_stat_activity`, EXPLAIN, `%Q`. |
| `log_statement_stats` | boolean | off | - | superuser | Log total per-statement performance statistics (getrusage-like). Cannot be enabled together with the per-module options. |
| `log_parser_stats` | boolean | off | - | superuser | Per-module stats: parser. |
| `log_planner_stats` | boolean | off | - | superuser | Per-module stats: planner. |
| `log_executor_stats` | boolean | off | - | superuser | Per-module stats: executor. |

### GUC 19.10 Vacuuming  [M7, M5]  (source: runtime-config-vacuum.txt)

**19.10.1 Automatic Vacuuming** (many overridable per table via storage parameters)
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `autovacuum` | boolean | on | - | sighup (per-table disable via storage parameter) | Run the autovacuum launcher daemon. Needs `track_counts`. **Even when off, autovacuum processes are launched if necessary to prevent transaction ID wraparound.** |
| `autovacuum_worker_slots` | integer | typically 16 (may be less per initdb/kernel) | - | postmaster | Backend slots reserved for autovacuum workers. (New in 18.) |
| `autovacuum_max_workers` | integer | 3 | - | sighup | Max autovacuum workers (excluding launcher) running at once; values above autovacuum_worker_slots have no effect. |
| `autovacuum_naptime` | integer | 1min | s | sighup | Minimum delay between autovacuum runs on any given database. |
| `autovacuum_vacuum_threshold` | integer | 50 | tuples | sighup (+table) | Minimum updated or deleted tuples to trigger VACUUM. |
| `autovacuum_vacuum_insert_threshold` | integer | 1000 | tuples | sighup (+table) | Inserted tuples to trigger VACUUM; -1 disables insert-triggered vacuum. |
| `autovacuum_analyze_threshold` | integer | 50 | tuples | sighup (+table) | Minimum inserted, updated or deleted tuples to trigger ANALYZE. |
| `autovacuum_vacuum_scale_factor` | float | 0.2 | fraction of table size | sighup (+table) | Added to autovacuum_vacuum_threshold. |
| `autovacuum_vacuum_insert_scale_factor` | float | 0.2 | fraction of **unfrozen pages** in table | sighup (+table) | Added to autovacuum_vacuum_insert_threshold. |
| `autovacuum_analyze_scale_factor` | float | 0.1 | fraction of table size | sighup (+table) | Added to autovacuum_analyze_threshold. |
| `autovacuum_vacuum_max_threshold` | integer | 100,000,000 | tuples | sighup (+table) | Upper limit on the value computed from vacuum_threshold + scale_factor; -1 = no cap. (New in 18.) |
| `autovacuum_freeze_max_age` | integer | 200 million | transactions | postmaster (can only be reduced per table) | Max age of `pg_class.relfrozenxid` before a VACUUM is forced to prevent XID wraparound. Relatively low because vacuum also allows removal of old `pg_xact` files. |
| `autovacuum_multixact_freeze_max_age` | integer | 400 million | multixacts | postmaster (reduce per table) | Max age of `pg_class.relminmxid` before forced VACUUM; allows removal of old `pg_multixact/members` and `pg_multixact/offsets` files. |
| `autovacuum_vacuum_cost_delay` | float | 2ms | ms | sighup (+table) | Cost delay for automatic VACUUM; -1 = use vacuum_cost_delay. |
| `autovacuum_vacuum_cost_limit` | integer | -1 (use vacuum_cost_limit) | cost | sighup (+table) | Cost limit for automatic VACUUM; **distributed proportionally among running autovacuum workers** so the sum does not exceed it. |

Autovacuum trigger formulas implied by these definitions:
- VACUUM when updated+deleted tuples > min(`autovacuum_vacuum_max_threshold`, `autovacuum_vacuum_threshold` + `autovacuum_vacuum_scale_factor` * table size) => default 50 + 0.2 * reltuples, capped at 100,000,000.
- Insert-triggered VACUUM when inserted tuples > `autovacuum_vacuum_insert_threshold` + `autovacuum_vacuum_insert_scale_factor` * (unfrozen pages portion) => default 1000 + 0.2 * unfrozen.
- ANALYZE when inserted+updated+deleted tuples > `autovacuum_analyze_threshold` + `autovacuum_analyze_scale_factor` * table size => default 50 + 0.1 * reltuples.

**19.10.2 Cost-based Vacuum Delay** — VACUUM and ANALYZE keep an internal counter of estimated I/O cost; when accumulated cost reaches `vacuum_cost_limit`, the process sleeps `vacuum_cost_delay`, resets the counter and continues. Disabled by default for manual VACUUM (delay 0).
| Parameter | Type | Default | Unit | Meaning / notes |
|---|---|---|---|---|
| `vacuum_cost_delay` | float | 0 (disabled) | ms | Sleep time when cost limit exceeded. Useful values are small, perhaps < 1 ms. |
| `vacuum_cost_page_hit` | integer | 1 | cost | Vacuuming a buffer found in shared buffer cache (lock buffer pool, look up shared hash table, scan the page). |
| `vacuum_cost_page_miss` | integer | 2 | cost | Buffer that has to be read from disk. |
| `vacuum_cost_page_dirty` | integer | 20 | cost | Charged when vacuum modifies a block that was previously clean (extra I/O to flush it again). |
| `vacuum_cost_limit` | integer | 200 | cost | Accumulated cost that causes the sleep. |
- No delays during operations holding critical locks, so the balance can overshoot; actual delay = `vacuum_cost_delay * accumulated_balance / vacuum_cost_limit`, with a maximum of `vacuum_cost_delay * 4`.

**19.10.3 Default Behavior**
| Parameter | Type | Default | Meaning / notes |
|---|---|---|---|
| `vacuum_truncate` | boolean | true | VACUUM/autovacuum try to truncate empty pages at the end of the table and return space to the OS; **requires ACCESS EXCLUSIVE lock**. Overridden by VACUUM's `TRUNCATE` option and per-table storage parameter. (GUC new in 18.) |

**19.10.4 Freezing** — rows sufficiently old are marked *frozen*: visible to everyone, no need to examine their inserting XID. VACUUM does the freezing.
| Parameter | Type | Default | Settable range | Effective clamp | Meaning |
|---|---|---|---|---|---|
| `vacuum_freeze_table_age` | integer | 150 million transactions | 0 to 2 billion | silently limited to 95% of autovacuum_freeze_max_age | VACUUM performs an **aggressive scan** when `pg_class.relfrozenxid` reaches this age: visits every page that might contain unfrozen XIDs or MXIDs, not just those that might contain dead tuples. |
| `vacuum_freeze_min_age` | integer | 50 million transactions | 0 to 1 billion | limited to half of autovacuum_freeze_max_age | Cutoff age VACUUM uses to decide whether to trigger freezing of pages that have an older XID. |
| `vacuum_failsafe_age` | integer | 1.6 billion transactions | 0 to 2.1 billion | no less than 105% of autovacuum_freeze_max_age | Last-resort failsafe: cost-based delay no longer applied, non-essential tasks (index vacuuming) bypassed, Buffer Access Strategy disabled (VACUUM may use all of shared buffers). |
| `vacuum_multixact_freeze_table_age` | integer | 150 million multixacts | 0 to 2 billion | 95% of autovacuum_multixact_freeze_max_age | Aggressive scan when `pg_class.relminmxid` reaches this age. |
| `vacuum_multixact_freeze_min_age` | integer | 5 million multixacts | 0 to 1 billion | half of autovacuum_multixact_freeze_max_age | Cutoff age for freezing pages with an older multixact ID. |
| `vacuum_multixact_failsafe_age` | integer | 1.6 billion multixacts | 0 to 2.1 billion | no less than 105% of autovacuum_multixact_freeze_max_age | Multixact failsafe (delay dropped, index vacuuming bypassed). |
| `vacuum_max_eager_freeze_failure_rate` | float | 0.03 (3%) | - | - | Max fraction of the relation's pages that VACUUM may scan and fail to set all-frozen in the visibility map before disabling **eager scanning**; 0 disables eager scanning. Only failures count; successful eager freezes are capped internally at 20% of the all-visible-but-not-all-frozen pages. Per-table storage parameter override. (New in 18.) |

### GUC 19.11 Client Connection Defaults  [M1, M3, M5, M6]  (source: runtime-config-client.txt)

**19.11.1 Statement Behavior**
| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `client_min_messages` | enum | `NOTICE` | - | user | Levels sent to client: DEBUG5, DEBUG4, DEBUG3, DEBUG2, DEBUG1, LOG, NOTICE, WARNING, ERROR. INFO is always sent. LOG ranks differently than in log_min_messages. |
| `search_path` | string | `"$user", public` | - | user | Schema search order for unqualified names (see rules below). |
| `row_security` | boolean | on | - | user | off => queries that would apply at least one row security policy raise an error instead (pg_dump sets off). No effect for superusers and BYPASSRLS roles. |
| `default_table_access_method` | string | `heap` | - | user | Table AM for CREATE TABLE / materialized view without explicit AM and for SELECT ... INTO. |
| `default_tablespace` | string | '' (database's default tablespace) | - | user | Default tablespace for tables and indexes. Not used for temp tables (temp_tablespaces) nor CREATE DATABASE. A non-empty value at partitioned-table creation becomes that table's tablespace for future partitions. |
| `default_toast_compression` | enum | `pglz` | - | user | Default TOAST compression for compressible columns: `pglz`, `lz4` (if built --with-lz4). Per-column `COMPRESSION` option overrides. |
| `temp_tablespaces` | string | '' | - | user | Tablespaces for temporary objects and temp files for sorting; random member per object, successive members within a transaction. |
| `check_function_bodies` | boolean | on | - | user | off disables validation of routine body during CREATE FUNCTION/PROCEDURE (pg_dump sets off). |
| `default_transaction_isolation` | enum | `read committed` | - | user | "read uncommitted", "read committed", "repeatable read", "serializable". |
| `default_transaction_read_only` | boolean | off | - | user | Read-only transactions cannot alter non-temporary tables. |
| `default_transaction_deferrable` | boolean | off | - | user | For serializable read-only transactions: may be delayed before proceeding, then runs without serializability overhead or abort risk. No effect on read-write or lower isolation levels. |
| `transaction_isolation` | enum | (from default_*) | - | user | Reflects current transaction's isolation level; setting it = SET TRANSACTION. |
| `transaction_read_only` | boolean | (from default_*) | - | user | Current transaction's read-only status. |
| `transaction_deferrable` | boolean | (from default_*) | - | user | Current transaction's deferrable status. |
| `session_replication_role` | enum | `origin` | - | superuser | `origin`, `replica`, `local`. `replica` => triggers and rules in default configuration do not fire; **also disables all foreign key checks** (FKs are triggers). origin and local treated the same internally. Changing it discards cached plans. |
| `statement_timeout` | integer | 0 (disabled) | ms | user | Abort any statement taking longer. Measured from command arrival until completion; applied per statement in a multi-statement simple-query message (before 13: whole string). Extended protocol: starts at Parse/Bind/Execute/Describe, cancelled by completion of Execute or Sync. Not recommended in postgresql.conf. |
| `transaction_timeout` | integer | 0 | ms | user | Terminate any session spending longer than this in a transaction (explicit or implicit single-statement). If <= idle_in_transaction_session_timeout or statement_timeout the longer timeout is ignored. Prepared transactions are not subject. |
| `lock_timeout` | integer | 0 | ms | user | Abort any statement that waits longer than this to acquire a lock (table, index, row, other object); applies separately to each lock acquisition attempt, explicit or implicit. |
| `idle_in_transaction_session_timeout` | integer | 0 | ms | user | Terminate sessions idle within an open transaction longer than this (they hold locks and prevent vacuuming recently-dead tuples => bloat). |
| `idle_session_timeout` | integer | 0 | ms | user | Terminate sessions idle outside a transaction longer than this. Be wary with connection poolers. |
| `bytea_output` | enum | `hex` | - | user | `hex` or `escape`; input accepts both. |
| `xmlbinary` | enum | `base64` | - | user | `base64` or `hex` for binary values in XML. |
| `xmloption` | enum | `CONTENT` | - | user | `DOCUMENT` or `CONTENT`; also `SET XML OPTION { DOCUMENT | CONTENT };`. |
| `gin_pending_list_limit` | integer | 4MB | kB | user | Max size of a GIN index's pending list (fastupdate); when exceeded the list is flushed in bulk into the main GIN structure. Per-index storage parameter override. |
| `createrole_self_grant` | string | '' | - | user | For CREATEROLE non-superusers: newly created role is granted back to the creator with options `set`, `inherit`, or both. |
| `event_triggers` | boolean | true | - | superuser | false disables all event triggers (for repairing faulty ones). |
| `restrict_nonsystem_relation_kind` | string | '' | - | user | Comma-separated relation kinds for which access to non-system relations is prohibited: `view`, `foreign-table`. |

**search_path rules**
1. Comma-separated list of schema names; names of non-existent schemas or schemas without USAGE permission are silently ignored.
2. `$user` is replaced by the schema named like `CURRENT_USER` if it exists and the user has USAGE.
3. `pg_catalog` is always searched: in the listed position if mentioned, otherwise **before** all path items.
4. The session's temporary schema `pg_temp_nnn` (alias `pg_temp`) is always searched if it exists: if not listed, it is searched **first (even before pg_catalog)**, but only for relation (table, view, sequence, etc.) and data type names; **never for function or operator names**.
5. Objects created without a schema go into the first valid schema in the path; error if the path is empty.
6. `current_schemas()` shows the resolved effective path. Default configuration is suitable only for a single user or a few mutually-trusting users.

**19.11.2 Locale and Formatting**
| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `DateStyle` | string | `ISO, MDY` built-in (initdb writes a value matching lc_time) | user | Two components: output format (`ISO`, `Postgres`, `SQL`, `German`) and field order (`DMY`, `MDY`, `YMD`); `Euro`/`European` = DMY; `US`/`NonEuro`/`NonEuropean` = MDY. |
| `IntervalStyle` | enum | `postgres` | user | `sql_standard`, `postgres`, `postgres_verbose`, `iso_8601`. Also affects ambiguous interval input. |
| `TimeZone` | string | GMT built-in (initdb writes system zone) | user | Time zone for displaying and interpreting timestamps. |
| `timezone_abbreviations` | string | `'Default'` | user | Extra time zone abbreviation set: `Default`, `Australia`, `India`. |
| `extra_float_digits` | integer | 1 | user | >= 1 (up to 3): shortest-precise output (at most 17 digits for float8, 9 for float4; round-trips exactly). <= 0: rounded to FLT_DIG/DBL_DIG reduced by the value (-1 => float4 5 digits, float8 14 digits). Meaning and default changed in PostgreSQL 12. |
| `client_encoding` | string | database encoding | user | Client-side character set. |
| `lc_messages` | string | '' (inherited from server environment) | superuser | Language of messages. |
| `lc_monetary` | string | '' | user | Locale for formatting monetary amounts (to_char). |
| `lc_numeric` | string | '' | user | Locale for formatting numbers. |
| `lc_time` | string | '' | user | Locale for formatting dates and times. |
| `icu_validation_level` | enum | `WARNING` | user | Message level for ICU locale validation problems: DISABLED, DEBUG5..DEBUG1, INFO, NOTICE, WARNING, ERROR, LOG. |
| `default_text_search_config` | string | `pg_catalog.simple` built-in (initdb picks one matching lc_ctype) | user | Text search configuration used when none is given explicitly. |

**19.11.3 Shared Library Preloading** — only PostgreSQL-specific libraries (checked via the "magic block"); e.g. `'$libdir/mylib'`; PLs as `'$libdir/plXXX'` (pgsql, perl, tcl, python).
| Parameter | Default | Context | Meaning / notes |
|---|---|---|---|
| `local_preload_libraries` | '' | any user, effective only at connection start | Libraries preloaded at connection start; restricted to the `plugins` subdirectory of the library directory (`$libdir/plugins/mylib` or just `mylib`). Missing library => connection fails. Typically set via PGOPTIONS or ALTER ROLE SET. |
| `session_preload_libraries` | '' | superuser, effective at connection start | Libraries preloaded at connection start (e.g. `auto_explain` for one role via ALTER ROLE SET); no restart needed. |
| `shared_preload_libraries` | '' | postmaster | Libraries preloaded at server start; required for libraries that allocate shared memory, reserve light-weight locks, or start background workers (e.g. pg_stat_statements). Missing library => server fails to start. On Windows each process re-loads them. |
| `jit_provider` | `llvmjit` | postmaster | JIT provider library; non-existent => JIT unavailable but no error. |

**19.11.4 Other Defaults**
| Parameter | Default | Context | Meaning / notes |
|---|---|---|---|
| `dynamic_library_path` | `'$libdir'` | superuser (session-only; set in postgresql.conf normally) | Colon-separated (semicolon on Windows) absolute directories searched for modules named without a slash in CREATE FUNCTION/LOAD. `$libdir` = `pg_config --pkglibdir`. Empty disables search. |
| `extension_control_path` | `'$system'` | superuser | Path searched for extension control files (`name.control`); each element is expected to have an `extension` subdirectory (suffix appended automatically); `$system` = `pg_config --sharedir`; first match wins. Usually set together with dynamic_library_path. (New in 18.) |
| `gin_fuzzy_search_limit` | (not stated; 0) | user | Soft upper limit on the size of the set returned by GIN index scans. |

### GUC 19.12 Lock Management  [M5]  (source: runtime-config-locks.txt)

| Parameter | Type | Default | Unit | Context | Meaning / notes |
|---|---|---|---|---|---|
| `deadlock_timeout` | integer | 1s | ms | superuser | Time to wait on a lock before running the (relatively expensive) deadlock check; optimistic assumption that deadlocks are rare. 1s is "probably about the smallest value you would want in practice"; ideally exceed typical transaction time. Also the threshold for `log_lock_waits` and `log_recovery_conflict_waits` messages. |
| `max_locks_per_transaction` | integer | 64 | - | postmaster | Shared lock table has space for this many objects (e.g. tables) **per server process or prepared transaction**; it limits the *average*, a single transaction may lock more if everything fits. Not a row limit (row locks are unlimited). Raise for queries touching many tables (e.g. parent with many partitions). Standby must be >= primary. |
| `max_pred_locks_per_transaction` | integer | 64 | - | postmaster | Same sizing rule for the shared predicate (SIREAD) lock table used by SERIALIZABLE. |
| `max_pred_locks_per_relation` | integer | -2 | - | sighup | Pages/tuples of one relation that can be predicate-locked before promotion to a whole-relation lock. >= 0 absolute; negative = max_pred_locks_per_transaction / abs(value) (default -2 => 32). |
| `max_pred_locks_per_page` | integer | 2 | - | sighup | Rows on one page that can be predicate-locked before promotion to a page lock. |

- Lock table capacity implied: approximately `max_locks_per_transaction * (max_connections + max_prepared_transactions + background/aux processes)` slots shared by everyone.
- Predicate lock granularity escalation: tuple -> page (after `max_pred_locks_per_page` tuples on a page) -> relation (after `max_pred_locks_per_relation` pages/tuples).

### GUC 19.13 Version and Platform Compatibility  [M3, M7]  (source: runtime-config-compatible.txt)

| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `array_nulls` | boolean | on | user | Array input parser treats unquoted `NULL` as a null element (pre-8.2 treated it as the string "NULL"). |
| `backslash_quote` | enum | `safe_encoding` | user | Whether `\'` may represent a quote in non-standard-conforming literals (incl. `E'...'`): `on`, `off`, `safe_encoding` (allow only if client encoding cannot contain ASCII `\` inside a multibyte char). SQL-injection risk motivation. |
| `escape_string_warning` | boolean | on | user | Warn when backslash appears in an ordinary `'...'` literal and standard_conforming_strings is off. |
| `lo_compat_privileges` | boolean | off | superuser | Disable large-object privilege checks introduced in 9.0. |
| `quote_all_identifiers` | boolean | off | user | Force quoting of all identifiers in generated SQL (EXPLAIN, pg_get_viewdef). |
| `standard_conforming_strings` | boolean | on (since 9.1) | user | Ordinary literals treat backslashes literally; use `E'...'` for escapes. |
| `synchronize_seqscans` | boolean | on | user | Concurrent seqscans of large tables synchronize (a scan may start mid-table and wrap around) => **row order without ORDER BY can change unpredictably**. off = pre-8.3 behaviour (always start at block 0). |
| `transform_null_equals` | boolean | off | user | Treat `expr = NULL` as `expr IS NULL` (MS Access compatibility). Only the literal `= NULL` form; not IN etc. |
| `allow_alter_system` | boolean | on | sighup | off => ALTER SYSTEM raises an error. **Not a security feature** (superusers can still write postgresql.auto.conf via shell); for externally managed configuration. postgresql.auto.conf still takes effect. |

### GUC 19.14 Error Handling  [M1, M7]  (source: runtime-config-error-handling.txt)

| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `exit_on_error` | boolean | off | user | Any error terminates the session (normally only FATAL does). |
| `restart_after_crash` | boolean | on | sighup | Automatically reinitialize after a backend crash; turn off when clusterware should take control. |
| `data_sync_retry` | boolean | off | postmaster | off => **PANIC on failure to flush modified data files** (server crashes, recovers from WAL), because after a write-back failure the kernel page cache state is unknown and a retry may falsely succeed. on => report error and retry at a later checkpoint (only after studying the OS's behaviour). |
| `recovery_init_sync_method` | enum | `fsync` | sighup | Before crash recovery: `fsync` recursively opens and fsyncs every file in the data directory (following symlinks for pg_wal and tablespaces only); `syncfs` (Linux) syncs whole file systems (faster, but affected by other apps' dirty data; before Linux 5.8 I/O errors may not be reported). Applies to any start after an unclean shutdown, including pg_basebackup copies. |

### GUC 19.15 Preset Options (read-only, internal)  [M1, M2]  (source: runtime-config-preset.txt)

| Parameter | Type | Value / default | Meaning |
|---|---|---|---|
| `block_size` | integer | 8192 bytes (BLCKSZ) | Disk block size; affects meaning of block-unit GUCs such as shared_buffers. |
| `data_checksums` | boolean | build/initdb | Whether data checksums are enabled (`initdb -k`). |
| `data_directory_mode` | integer | e.g. 0700 / 0750 | Permissions the data directory had at startup (always 0700 on Windows); see `initdb -g`. |
| `debug_assertions` | boolean | off by default | Built with USE_ASSERT_CHECKING (`--enable-cassert`). |
| `huge_pages_status` | enum | on / off / unknown | Actual huge-page state (unknown with `postgres -C`); check result of `huge_pages=try`. |
| `integer_datetimes` | boolean | always on since PG 10 | 64-bit integer dates/times. |
| `in_hot_standby` | boolean | - | Server currently in hot standby (all transactions read-only); changes in-session only on promotion. |
| `max_function_args` | integer | 100 | FUNC_MAX_ARGS. |
| `max_identifier_length` | integer | 63 | NAMEDATALEN - 1 (NAMEDATALEN 64); bytes, so fewer characters in multibyte encodings. |
| `max_index_keys` | integer | 32 | INDEX_MAX_KEYS. |
| `num_os_semaphores` | integer | computed | Semaphores needed, based on max_connections, **autovacuum_max_workers** (wording of this page; 18.4.1 says autovacuum_worker_slots), max_wal_senders, max_worker_processes, etc. |
| `segment_size` | integer | 131072 blocks (1GB / 8kB) | Blocks per relation file segment (RELSEG_SIZE); segment bytes = segment_size * block_size = 1GB default. |
| `server_encoding` | string | per database | Database encoding, fixed at CREATE DATABASE. |
| `server_version` | string | e.g. 18.7 | PG_VERSION. |
| `server_version_num` | integer | e.g. 180007 | PG_VERSION_NUM. |
| `shared_memory_size` | integer | computed | Main shared memory area size, rounded up to nearest MB. |
| `shared_memory_size_in_huge_pages` | integer | computed; -1 if unsupported | Huge pages needed for main shared memory based on huge_page_size; Linux only. |
| `ssl_library` | string | e.g. `OpenSSL` or '' | SSL library the server was built with. |
| `wal_block_size` | integer | 8192 bytes (XLOG_BLCKSZ) | WAL disk block size. |
| `wal_segment_size` | integer | 16MB | WAL segment size (set at initdb). |

### GUC 19.17 Developer Options  [M1, M2, M5, M7]  (source: runtime-config-developer.txt)

Never for production; some help recover severely damaged databases; many need special compile flags.
| Parameter | Type | Default | Context | Meaning / notes |
|---|---|---|---|---|
| `allow_in_place_tablespaces` | boolean | off | superuser | CREATE TABLESPACE with empty location creates a directory inside `pg_tblspc` (testing primary+standby on one host; confuses backup tools expecting symlinks). |
| `allow_system_table_mods` | boolean | off | superuser | Allow structural modification of system tables (otherwise forbidden even to superusers). |
| `backtrace_functions` | string | '' | superuser | Comma-separated C function names; an error raised in one of them writes a backtrace to the log. |
| `debug_copy_parse_plan_trees` | boolean | off | - | Pass all parse/plan trees through copyObject() (needs DEBUG_NODE_TESTS_ENABLED, auto with --enable-cassert). |
| `debug_discard_caches` | integer | 0 | - | 1 = invalidate every catalog cache entry at first opportunity (catalog caching effectively off; very slow); higher = recursive. Needs DISCARD_CACHES_ENABLED (cassert builds); always 0 in production builds. |
| `debug_io_direct` | string | '' | postmaster | Direct I/O (O_DIRECT / F_NOCACHE / FILE_FLAG_NO_BUFFERING) for `data`, `wal`, `wal_init`; currently reduces performance. |
| `debug_parallel_query` | enum | `off` | user | `on` adds a Gather on top of every parallel-safe plan so it runs in a worker; `regress` also hides the Gather in EXPLAIN and the worker context line. Use to find functions that should be PARALLEL UNSAFE/RESTRICTED. |
| `debug_raw_expression_coverage_test` | boolean | off | - | Walk raw DML parse trees with raw_expression_tree_walker() (cassert builds). |
| `debug_write_read_parse_plan_trees` | boolean | off | - | Round-trip trees through outfuncs.c/readfuncs.c (cassert builds). |
| `ignore_system_indexes` | boolean | off | backend (not changeable after session start) | Ignore system indexes when reading system tables (still updated); for damaged system indexes. |
| `post_auth_delay` | integer | 0 | backend | Seconds to delay after authentication (attach debugger). |
| `pre_auth_delay` | integer | 0 | sighup | Seconds to delay right after fork, before authentication. |
| `trace_notify` | boolean | off | user | Debug output for LISTEN/NOTIFY (needs DEBUG1 message level). |
| `trace_sort` | boolean | off | user | Emit resource usage during sort operations. |
| `trace_locks` | boolean | off | - | Dump heavyweight lock operations (lock id tuple, grantMask, req/grant counts per mode, wait mask, lock type). LOCK_DEBUG builds; structure in `src/include/storage/lock.h`. Example line: `LOG: LockAcquire: new: lock(0xb7acd844) id(24688,24696,0,0,0,1) grantMask(0) req(0,0,0,0,0,0,0)=0 grant(0,0,0,0,0,0,0)=0 wait(0) type(AccessShareLock)`; sequence LockAcquire -> GrantLock -> UnGrantLock -> CleanUpLock. |
| `trace_lwlocks` | boolean | off | - | Lightweight lock usage (LOCK_DEBUG). LWLocks protect shared-memory data structures. |
| `trace_userlocks` | boolean | off | - | Same as trace_locks for advisory locks (LOCK_DEBUG). |
| `trace_lock_oidmin` | integer | (not stated) | - | Do not trace locks on tables below this OID (LOCK_DEBUG). |
| `trace_lock_table` | integer | (not stated) | - | Unconditionally trace locks on this table OID (LOCK_DEBUG). |
| `debug_deadlocks` | boolean | off | - | Dump all current locks when a deadlock timeout occurs (LOCK_DEBUG). |
| `log_btree_build_stats` | boolean | off | - | Resource usage for B-tree operations (BTREE_BUILD_STATS builds). |
| `wal_consistency_checking` | string | '' | superuser | Add FPIs to WAL records and, on replay, compare buffers with the images (FATAL on unexpected difference; hint-bit variations ignored). `all` or list of resource managers: heap, heap2, btree, hash, gin, gist, sequence, spgist, brin, generic. |
| `wal_debug` | boolean | off | - | WAL debugging output (WAL_DEBUG builds). |
| `ignore_checksum_failure` | boolean | off | superuser | With data checksums: warn instead of error on checksum failure and continue (may crash, propagate/hide corruption). Corrupt header still errors. |
| `composite_type_mismatch` | enum | `error` | superuser | Reading a composite value whose row type was altered incompatibly: `error`, `warn`, `disabled`. |
| `zero_damaged_pages` | boolean | off | superuser | Damaged page header => warning, page zeroed **in memory**, processing continues; destroys all rows on that page; zeroed pages are not forced to disk, so recreate the table/index before turning off. |
| `ignore_invalid_pages` | boolean | off | postmaster | During recovery, ignore WAL references to invalid pages (warn) instead of PANIC. |
| `jit_debugging_support` | boolean | off | sb-backend | Register JIT functions with GDB. |
| `jit_dump_bitcode` | boolean | off | superuser | Write generated LLVM IR into data_directory. |
| `jit_expressions` | boolean | on | user | JIT-compile expressions when JIT is active. |
| `jit_profiling_support` | boolean | off | sb-backend | Emit perf data to `~/.debug/jit/`. |
| `jit_tuple_deforming` | boolean | on | user | JIT-compile tuple deforming when JIT is active. |
| `remove_temp_files_after_crash` | boolean | on | sighup | Remove temporary files after a backend crash. |
| `send_abort_for_crash` | boolean | off | sighup | After a backend crash, send children SIGABRT (core dumps) instead of SIGQUIT. |
| `send_abort_for_kill` | boolean | off | sighup | Send SIGABRT instead of SIGKILL to children still alive 5 seconds after SIGQUIT. |
| `debug_logical_replication_streaming` | enum | `buffered` | user | `immediate`: publisher streams/serializes each change instead of waiting for logical_decoding_work_mem; subscriber leader (streaming=parallel) serializes all changes to files instead of the shared memory queue. |

### 19.18 Short options (Table 19.6)  [M1]  (source: runtime-config-short.txt)

| Short option | Equivalent |
|---|---|
| `-B x` | `shared_buffers = x` |
| `-d x` | `log_min_messages = DEBUGx` |
| `-e` | `datestyle = euro` |
| `-fb` / `-fh` / `-fi` / `-fm` / `-fn` / `-fo` / `-fs` / `-ft` | `enable_bitmapscan` / `enable_hashjoin` / `enable_indexscan` / `enable_mergejoin` / `enable_nestloop` / `enable_indexonlyscan` / `enable_seqscan` / `enable_tidscan` `= off` |
| `-F` | `fsync = off` |
| `-h x` | `listen_addresses = x` |
| `-i` | `listen_addresses = '*'` |
| `-k x` | `unix_socket_directories = x` |
| `-l` | `ssl = on` |
| `-N x` | `max_connections = x` |
| `-O` | `allow_system_table_mods = on` |
| `-p x` | `port = x` |
| `-P` | `ignore_system_indexes = on` |
| `-s` | `log_statement_stats = on` |
| `-S x` | `work_mem = x` |
| `-tpa` / `-tpl` / `-te` | `log_parser_stats` / `log_planner_stats` / `log_executor_stats = on` |
| `-W x` | `post_auth_delay = x` |

### pg_hba.conf authentication methods  [M6]  (source: auth-pg-hba-conf.txt and 20.4-20.15)

| Method | Connection types | Password on wire | Options | One-line meaning |
|---|---|---|---|---|
| `trust` | all | none | - | Allow unconditionally as any user (even superuser). |
| `reject` | all | - | - | Reject unconditionally (filter hosts before a broader allow line). |
| `scram-sha-256` | all | challenge-response (RFC 7677) | - | SCRAM password verification; most secure password method. |
| `md5` | all | challenge-response | - | MD5 or (automatically) SCRAM if the stored hash is SCRAM; deprecated. |
| `password` | all | cleartext | - | Cleartext password; only safe under SSL. |
| `gss` | TCP/IP only | none (Kerberos) | `include_realm` (default 1), `map`, `krb_realm` | GSSAPI (RFC 2743), usable with GSSAPI encryption. |
| `sspi` | Windows only | none | `include_realm`, `compat_realm` (default 1), `upn_username` (default off), `map`, `krb_realm` | Windows SSPI negotiate (Kerberos, fallback NTLM). |
| `ident` | TCP/IP (local => peer) | none | `map` | Ask client's RFC 1413 ident server (port 113). |
| `peer` | local only | none | `map` | OS user name from the kernel (getpeereid/SO_PEERCRED). |
| `ldap` | all | cleartext to server | `ldapserver`, `ldapport`, `ldapscheme`, `ldaptls`, `ldapprefix`, `ldapsuffix`, `ldapbasedn`, `ldapbinddn`, `ldapbindpasswd`, `ldapsearchattribute`, `ldapsearchfilter`, `ldapurl` | Validate name/password by LDAP simple bind or search+bind. |
| `radius` | all | cleartext to server | `radiusservers` (req), `radiussecrets` (req), `radiusports` (1812), `radiusidentifiers` (`postgresql`) | Validate name/password via RADIUS Access Request. |
| `cert` | hostssl only | none | `map` (+ `clientname=CN|DN`) | Client certificate CN must match user; = trust + clientcert=verify-full. |
| `pam` | all | cleartext to server | `pamservice` (default `postgresql`), `pam_use_hostname` | Validate via PAM. |
| `bsd` | all | cleartext to server | - | OpenBSD BSD Authentication (`auth-postgresql` login type). |
| `oauth` | all (use SSL) | bearer token | `issuer` (req), `scope` (req), `validator`, `map`, `delegate_ident_mapping` | OAuth 2.0 bearer-token authorization (new in 18). |
| (any, hostssl) | hostssl | - | `clientcert=verify-ca|verify-full`, `clientname=CN|DN` | Method-independent certificate verification. |

Connection types: `local`, `host`, `hostssl`, `hostnossl`, `hostgssenc`, `hostnogssenc`, plus `include`, `include_if_exists`, `include_dir`. Database keywords: `all`, `sameuser`, `samerole` (`samegroup`), `replication`, `/regex`, `@file`. User keywords: `all`, `+role`, `/regex`, `@file`. Address keywords: `all`, `samehost`, `samenet`, `.suffix` host names.

### Role attributes  [M1, M6]  (source: role-attributes.txt)

| Attribute (CREATE ROLE option) | Default | pg_roles column | Meaning |
|---|---|---|---|
| `LOGIN` / `NOLOGIN` | NOLOGIN (CREATE USER: LOGIN) | `rolcanlogin` | Can be the initial role of a connection ("database user"). |
| `SUPERUSER` / `NOSUPERUSER` | NOSUPERUSER | `rolsuper` | Bypasses all permission checks except the right to log in; only a superuser can create one. |
| `CREATEDB` / `NOCREATEDB` | NOCREATEDB | `rolcreatedb` | May create databases. |
| `CREATEROLE` / `NOCREATEROLE` | NOCREATEROLE | `rolcreaterole` | May create roles; may alter/drop roles on which it has ADMIN OPTION (granted back automatically on creation); no power over superusers, REPLICATION or BYPASSRLS. |
| `REPLICATION` / `NOREPLICATION` | NOREPLICATION | `rolreplication` | May initiate streaming replication (needs LOGIN too): `CREATE ROLE name REPLICATION LOGIN`. |
| `PASSWORD 'string'` | null (password auth always fails) | `rolpassword` (in pg_authid) | Used by password-based methods; stored hashed per password_encryption. |
| `INHERIT` / `NOINHERIT` | INHERIT | `rolinherit` | Default inheritance for this role's memberships; per-grant `WITH INHERIT TRUE|FALSE`. |
| `BYPASSRLS` / `NOBYPASSRLS` | NOBYPASSRLS | `rolbypassrls` | Bypass every row-level security policy; set by a superuser. |
| `CONNECTION LIMIT n` | -1 (no limit) | `rolconnlimit` | Max concurrent connections for the role. |

Membership grant options: `ADMIN` (may grant/revoke membership to others, administer the role), `INHERIT` (use privileges automatically), `SET` (default TRUE; may SET ROLE). Attributes LOGIN, SUPERUSER, CREATEDB, CREATEROLE are never inherited.

### Predefined roles  [M1, M6, M7]  (source: predefined-roles.txt)

| Role | Grants the ability to |
|---|---|
| `pg_checkpoint` | Execute `CHECKPOINT`. |
| `pg_create_subscription` | Issue `CREATE SUBSCRIPTION` (with CREATE permission on the database). |
| `pg_database_owner` | Implicit role whose single member is always the current database owner; cannot be granted or have members; can own objects/receive grants (rights in a template propagate to owners of databases made from it). Initially owns the `public` schema. |
| `pg_maintain` | Run VACUUM, ANALYZE, CLUSTER, REFRESH MATERIALIZED VIEW, REINDEX, LOCK TABLE on all relations (as if having MAINTAIN). |
| `pg_monitor` | Read/execute monitoring views and functions; member of pg_read_all_settings, pg_read_all_stats, pg_stat_scan_tables. |
| `pg_read_all_settings` | Read all configuration variables, even superuser-only ones. |
| `pg_read_all_stats` | Read all `pg_stat_*` views and use statistics extensions, even superuser-only data. |
| `pg_stat_scan_tables` | Execute monitoring functions that may take ACCESS SHARE locks for a long time (e.g. `pgrowlocks(text)`). |
| `pg_read_all_data` | SELECT on all tables, views, sequences + USAGE on all schemas; does not bypass RLS. |
| `pg_write_all_data` | INSERT, UPDATE, DELETE on all tables, views, sequences + USAGE on all schemas; does not bypass RLS. |
| `pg_read_server_files` | Read files anywhere the server can access via COPY and file-access functions (superuser-equivalent risk). |
| `pg_write_server_files` | Write files anywhere the server can access via COPY and file-access functions. |
| `pg_execute_server_program` | Execute programs on the server as the database OS user via COPY ... PROGRAM etc. |
| `pg_signal_autovacuum_worker` | Signal autovacuum workers to cancel the current table's vacuum or terminate the session. |
| `pg_signal_backend` | Cancel queries / terminate other backends (not those owned by superusers). |
| `pg_use_reserved_connections` | Use the slots reserved by `reserved_connections`. |

Grant example: `GRANT pg_signal_backend TO admin_user;`. Permissions of predefined roles may change across releases.

### Locale categories and providers  [M2]  (source: locale.txt)

| Category | Controls | Fixed per database? | GUC |
|---|---|---|---|
| LC_COLLATE | String sort order | Yes (at CREATE DATABASE) | - (datcollate) |
| LC_CTYPE | Character classification, case mapping | Yes | - (datctype) |
| LC_MESSAGES | Language of messages | No | `lc_messages` |
| LC_MONETARY | Currency formatting | No | `lc_monetary` |
| LC_NUMERIC | Number formatting | No | `lc_numeric` |
| LC_TIME | Date/time formatting | No | `lc_time` |

Providers: `builtin` (C, C.UTF-8, PG_UNICODE_FAST), `icu` (BCP 47 tags, OS/encoding-independent, ICU-version-dependent), `libc` (OS C library, platform-dependent).

### Standard collations  [M2, M4]  (source: collation.txt)

| Collation | Order | Case mapping / regex | Encodings | Stability |
|---|---|---|---|---|
| `unicode` | Unicode Collation Algorithm (DUCET); = ICU root | ICU | all (needs ICU) | may change with ICU version |
| `ucs_basic` | code points; only ASCII A-Z letters | = libc C in UTF8 | UTF8 only | stable across all versions |
| `pg_unicode_fast` | code points | full case mapping; Standard properties | UTF8 only | stable within a major version |
| `pg_c_utf8` | code points | simple case mapping; POSIX Compatible properties | UTF8 only | stable within a major version |
| `C` / `POSIX` | byte values; only ASCII A-Z letters | traditional C | any (behaviour varies by encoding) | stable for a given encoding |
| `default` | the database's locale | - | - | - |

### Server/client character sets (Table 23.3)  [M2]  (source: multibyte.txt)

| Name | Description | Language | Server? | ICU? | Bytes/char | Aliases |
|---|---|---|---|---|---|---|
| BIG5 | Big Five | Traditional Chinese | No | No | 1-2 | WIN950, Windows950 |
| EUC_CN | Extended UNIX Code-CN | Simplified Chinese | Yes | Yes | 1-3 | |
| EUC_JP | Extended UNIX Code-JP | Japanese | Yes | Yes | 1-3 | |
| EUC_JIS_2004 | Extended UNIX Code-JP, JIS X 0213 | Japanese | Yes | No | 1-3 | |
| EUC_KR | Extended UNIX Code-KR | Korean | Yes | Yes | 1-3 | |
| EUC_TW | Extended UNIX Code-TW | Traditional Chinese, Taiwanese | Yes | Yes | 1-4 | |
| GB18030 | National Standard | Chinese | No | No | 1-4 | |
| GBK | Extended National Standard | Simplified Chinese | No | No | 1-2 | WIN936, Windows936 |
| ISO_8859_5 | ISO 8859-5, ECMA 113 | Latin/Cyrillic | Yes | Yes | 1 | |
| ISO_8859_6 | ISO 8859-6, ECMA 114 | Latin/Arabic | Yes | Yes | 1 | |
| ISO_8859_7 | ISO 8859-7, ECMA 118 | Latin/Greek | Yes | Yes | 1 | |
| ISO_8859_8 | ISO 8859-8, ECMA 121 | Latin/Hebrew | Yes | Yes | 1 | |
| JOHAB | JOHAB | Korean (Hangul) | No | No | 1-3 | |
| KOI8R | KOI8-R | Cyrillic (Russian) | Yes | Yes | 1 | KOI8 |
| KOI8U | KOI8-U | Cyrillic (Ukrainian) | Yes | Yes | 1 | |
| LATIN1 | ISO 8859-1, ECMA 94 | Western European | Yes | Yes | 1 | ISO88591 |
| LATIN2 | ISO 8859-2, ECMA 94 | Central European | Yes | Yes | 1 | ISO88592 |
| LATIN3 | ISO 8859-3, ECMA 94 | South European | Yes | Yes | 1 | ISO88593 |
| LATIN4 | ISO 8859-4, ECMA 94 | North European | Yes | Yes | 1 | ISO88594 |
| LATIN5 | ISO 8859-9, ECMA 128 | Turkish | Yes | Yes | 1 | ISO88599 |
| LATIN6 | ISO 8859-10, ECMA 144 | Nordic | Yes | Yes | 1 | ISO885910 |
| LATIN7 | ISO 8859-13 | Baltic | Yes | Yes | 1 | ISO885913 |
| LATIN8 | ISO 8859-14 | Celtic | Yes | Yes | 1 | ISO885914 |
| LATIN9 | ISO 8859-15 | LATIN1 with Euro and accents | Yes | Yes | 1 | ISO885915 |
| LATIN10 | ISO 8859-16, ASRO SR 14111 | Romanian | Yes | No | 1 | ISO885916 |
| MULE_INTERNAL | Mule internal code | Multilingual Emacs | Yes | No | 1-4 | |
| SJIS | Shift JIS | Japanese | No | No | 1-2 | Mskanji, ShiftJIS, WIN932, Windows932 |
| SHIFT_JIS_2004 | Shift JIS, JIS X 0213 | Japanese | No | No | 1-2 | |
| SQL_ASCII | unspecified | any | Yes | No | 1 | |
| UHC | Unified Hangul Code | Korean | No | No | 1-2 | WIN949, Windows949 |
| UTF8 | Unicode, 8-bit | all | Yes | Yes | 1-4 | Unicode |
| WIN866 | Windows CP866 | Cyrillic | Yes | Yes | 1 | ALT |
| WIN874 | Windows CP874 | Thai | Yes | No | 1 | |
| WIN1250 | Windows CP1250 | Central European | Yes | Yes | 1 | |
| WIN1251 | Windows CP1251 | Cyrillic | Yes | Yes | 1 | WIN |
| WIN1252 | Windows CP1252 | Western European | Yes | Yes | 1 | |
| WIN1253 | Windows CP1253 | Greek | Yes | Yes | 1 | |
| WIN1254 | Windows CP1254 | Turkish | Yes | Yes | 1 | |
| WIN1255 | Windows CP1255 | Hebrew | Yes | Yes | 1 | |
| WIN1256 | Windows CP1256 | Arabic | Yes | Yes | 1 | |
| WIN1257 | Windows CP1257 | Baltic | Yes | Yes | 1 | |
| WIN1258 | Windows CP1258 | Vietnamese | Yes | Yes | 1 | ABC, TCVN, TCVN5712, VSCII |

Non-server encodings (client-only): BIG5, GB18030, GBK, JOHAB, SJIS, SHIFT_JIS_2004, UHC.

### Built-in client/server conversions (Table 23.4) and conversion functions (Table 23.5)  [M2]  (source: multibyte.txt)

| Server charset | Available client charsets |
|---|---|
| EUC_CN | EUC_CN, MULE_INTERNAL, UTF8 |
| EUC_JP | EUC_JP, MULE_INTERNAL, SJIS, UTF8 |
| EUC_JIS_2004 | EUC_JIS_2004, SHIFT_JIS_2004, UTF8 |
| EUC_KR | EUC_KR, MULE_INTERNAL, UTF8 |
| EUC_TW | EUC_TW, BIG5, MULE_INTERNAL, UTF8 |
| ISO_8859_5 | ISO_8859_5, KOI8R, MULE_INTERNAL, UTF8, WIN866, WIN1251 |
| ISO_8859_6 / _7 / _8 | itself, UTF8 |
| KOI8R | KOI8R, ISO_8859_5, MULE_INTERNAL, UTF8, WIN866, WIN1251 |
| KOI8U | KOI8U, UTF8 |
| LATIN1 | LATIN1, MULE_INTERNAL, UTF8 |
| LATIN2 | LATIN2, MULE_INTERNAL, UTF8, WIN1250 |
| LATIN3, LATIN4 | itself, MULE_INTERNAL, UTF8 |
| LATIN5 ... LATIN10 | itself, UTF8 |
| MULE_INTERNAL | MULE_INTERNAL, BIG5, EUC_CN, EUC_JP, EUC_KR, EUC_TW, ISO_8859_5, KOI8R, LATIN1 to LATIN4, SJIS, WIN866, WIN1250, WIN1251 |
| SQL_ASCII | any (no conversion) |
| UTF8 | all supported encodings |
| WIN866 | WIN866, ISO_8859_5, KOI8R, MULE_INTERNAL, UTF8, WIN1251 |
| WIN874 | WIN874, UTF8 |
| WIN1250 | WIN1250, LATIN2, MULE_INTERNAL, UTF8 |
| WIN1251 | WIN1251, ISO_8859_5, KOI8R, MULE_INTERNAL, UTF8, WIN866 |
| WIN1252 ... WIN1258 | itself, UTF8 |
| BIG5, GB18030, GBK, JOHAB, SJIS, SHIFT_JIS_2004, UHC | not supported as server encoding |

Table 23.5 conversion functions (source -> destination), grouped by source:
- BIG5: big5_to_euc_tw, big5_to_mic, big5_to_utf8
- EUC_CN: euc_cn_to_mic, euc_cn_to_utf8
- EUC_JP: euc_jp_to_mic, euc_jp_to_sjis, euc_jp_to_utf8
- EUC_KR: euc_kr_to_mic, euc_kr_to_utf8
- EUC_TW: euc_tw_to_big5, euc_tw_to_mic, euc_tw_to_utf8
- GB18030: gb18030_to_utf8; GBK: gbk_to_utf8; JOHAB: johab_to_utf8; UHC: uhc_to_utf8
- LATINn / ISO: iso_8859_1_to_mic, iso_8859_1_to_utf8, iso_8859_2_to_mic, iso_8859_2_to_utf8, iso_8859_2_to_windows_1250, iso_8859_3_to_mic, iso_8859_3_to_utf8, iso_8859_4_to_mic, iso_8859_4_to_utf8, iso_8859_5_to_koi8_r, iso_8859_5_to_mic, iso_8859_5_to_utf8, iso_8859_5_to_windows_1251, iso_8859_5_to_windows_866, iso_8859_6_to_utf8, iso_8859_7_to_utf8, iso_8859_8_to_utf8, iso_8859_9_to_utf8 (LATIN5), iso_8859_10_to_utf8 (LATIN6), iso_8859_13_to_utf8 (LATIN7), iso_8859_14_to_utf8 (LATIN8), iso_8859_15_to_utf8 (LATIN9), iso_8859_16_to_utf8 (LATIN10)
- KOI8R: koi8_r_to_iso_8859_5, koi8_r_to_mic, koi8_r_to_utf8, koi8_r_to_windows_1251, koi8_r_to_windows_866; KOI8U: koi8_u_to_utf8
- MULE_INTERNAL: mic_to_big5, mic_to_euc_cn, mic_to_euc_jp, mic_to_euc_kr, mic_to_euc_tw, mic_to_iso_8859_1, mic_to_iso_8859_2, mic_to_iso_8859_3, mic_to_iso_8859_4, mic_to_iso_8859_5, mic_to_koi8_r, mic_to_sjis, mic_to_windows_1250, mic_to_windows_1251, mic_to_windows_866
- SJIS: sjis_to_euc_jp, sjis_to_mic, sjis_to_utf8
- UTF8: utf8_to_big5, utf8_to_euc_cn, utf8_to_euc_jp, utf8_to_euc_kr, utf8_to_euc_tw, utf8_to_gb18030, utf8_to_gbk, utf8_to_iso_8859_1, utf8_to_iso_8859_10, utf8_to_iso_8859_13, utf8_to_iso_8859_14, utf8_to_iso_8859_15, utf8_to_iso_8859_16, utf8_to_iso_8859_2, utf8_to_iso_8859_3, utf8_to_iso_8859_4, utf8_to_iso_8859_5, utf8_to_iso_8859_6, utf8_to_iso_8859_7, utf8_to_iso_8859_8, utf8_to_iso_8859_9, utf8_to_johab, utf8_to_koi8_r, utf8_to_koi8_u, utf8_to_sjis, utf8_to_windows_1258, utf8_to_uhc, utf8_to_windows_1250, utf8_to_windows_1251, utf8_to_windows_1252, utf8_to_windows_1253, utf8_to_windows_1254, utf8_to_windows_1255, utf8_to_windows_1256, utf8_to_windows_1257, utf8_to_windows_866, utf8_to_windows_874, utf8_to_euc_jis_2004, utf8_to_shift_jis_2004
- WIN125x / WIN866 / WIN874: windows_1250_to_iso_8859_2, windows_1250_to_mic, windows_1250_to_utf8, windows_1251_to_iso_8859_5, windows_1251_to_koi8_r, windows_1251_to_mic, windows_1251_to_utf8, windows_1251_to_windows_866, windows_1252_to_utf8, windows_1256_to_utf8, windows_1258_to_utf8, windows_866_to_iso_8859_5, windows_866_to_koi8_r, windows_866_to_mic, windows_866_to_utf8, windows_866_to_windows_1251 (docs list destination as "WIN"), windows_874_to_utf8
- JIS 2004: euc_jis_2004_to_utf8, shift_jis_2004_to_utf8, euc_jis_2004_to_shift_jis_2004, shift_jis_2004_to_euc_jis_2004

### Compile-time constants and on-disk layout facts (from ch.17-19)  [M2]

| Constant | Default | Allowed | Exposed as |
|---|---|---|---|
| BLCKSZ (`--with-blocksize`) | 8 kB | power of 2, 1-32 kB | `block_size` = 8192 |
| XLOG_BLCKSZ (`--with-wal-blocksize`) | 8 kB | power of 2, 1-64 kB | `wal_block_size` = 8192 |
| RELSEG_SIZE (`--with-segsize`) | 1 GB | power of 2 recommended | `segment_size` (blocks) |
| WAL segment size (initdb) | 16 MB | - | `wal_segment_size` |
| NAMEDATALEN | 64 | - | `max_identifier_length` = 63 |
| FUNC_MAX_ARGS | 100 | - | `max_function_args` |
| INDEX_MAX_KEYS | 32 | - | `max_index_keys` |
| default port (`--with-pgport`) | 5432 | - | `port` |
| Data dir modes | 0700/0600 (group: 0750/0640) | - | `data_directory_mode` |

## Lesson ideas

### Visualizers

- **GUC precedence ladder** [M1, M7]: stack of layers (built-in default -> postgresql.conf (last duplicate wins) -> postgresql.auto.conf (ALTER SYSTEM) -> `postgres -c` -> ALTER DATABASE SET -> ALTER ROLE SET -> ALTER ROLE IN DATABASE SET -> PGOPTIONS / SET -> SET LOCAL). The user toggles a value at each layer and sees `pg_settings.source`/`setting` update. Annotate the context badges (postmaster = restart, sighup = reload, superuser, user, backend) and show that a postmaster-context change sits in `pending_restart` until restart.
- **Shutdown signal timeline** [M1]: postmaster plus child processes; buttons SIGTERM / SIGINT / SIGQUIT. Smart waits for sessions to end; fast sends SIGTERM to children (transactions abort); immediate sends SIGQUIT, and after 5 s SIGKILL to survivors, followed by crash recovery (WAL replay) on next start. Contrast with SIGKILL on the postmaster (orphaned shared memory and semaphores).
- **Semaphore and shared-memory calculator** [M1]: sliders for max_connections, autovacuum_worker_slots, max_wal_senders, max_worker_processes; compute num_os_semaphores, sets of 16 plus the 17th "magic number" semaphore, and SEMMNI/SEMMNS needs (Table 18.1). Second panel: shared_buffers -> wal_buffers auto (1/32, clamped 64 kB..16 MB) -> shared_memory_size_in_huge_pages at 2 MB pages.
- **pg_hba.conf matcher** [M6]: editable rule list plus a simulated connection (type, IP, db, user, SSL/GSS). Animate the top-down scan and highlight the first match; show that a failure at that line does NOT fall through; show reverse+forward DNS check for host-name rules; `+role`, `sameuser`, `samerole`, `replication`, `/regex`, `@file` handling.
- **Role membership graph** [M1, M6]: nodes joe/admin/wheel/island with edges carrying INHERIT/SET/ADMIN flags (doc example). Clicking "SET ROLE x" recolors the effective privilege set; the graph shows that the inheritance chain stops at INHERIT FALSE, that SET ROLE can jump through SET TRUE chains, and that island is unreachable via SET.
- **synchronous_commit ladder** [M7]: primary and standby timelines with the WAL record moving through local flush -> standby write -> standby flush -> standby apply; each setting (off/local/remote_write/on/remote_apply) marks where COMMIT returns (Table 19.1). For `off`, show the at-most 3 x wal_writer_delay loss window.
- **Checkpoint and full-page-write animation** [M7]: page modified after a checkpoint gets a full page image in WAL the first time; later changes log only deltas; a torn 8 kB write during a crash is repaired from the FPI. Slider for checkpoint_timeout / max_wal_size showing the FPI volume trade-off; checkpoint_completion_target spreading writes.
- **Autovacuum trigger meter** [M7]: per-table gauge of n_dead_tup vs `min(vacuum_max_threshold, 50 + 0.2*reltuples)`, inserts vs `1000 + 0.2*unfrozen pages`, changes vs `50 + 0.1*reltuples`. Cost-bucket animation: hit 1 / miss 2 / dirty 20 until 200, then sleep 2 ms (autovacuum) and the capped `delay*balance/limit <= 4*delay` overshoot rule.
- **XID age freeze ladder** [M5, M7]: age axis with marks at vacuum_freeze_min_age 50M, vacuum_freeze_table_age 150M (clamped to 95% of 200M), autovacuum_freeze_max_age 200M (forced anti-wraparound vacuum even with autovacuum=off), vacuum_failsafe_age 1.6B (>= 105%); show what each threshold switches on.
- **Planner cost playground** [M4]: sliders for seq_page_cost, random_page_cost, cpu_* costs, effective_cache_size; re-run EXPLAIN to watch Seq Scan vs Index Scan vs Bitmap flip; toggle enable_* flags and see that enable_seqscan=off only discourages (cost penalty) rather than forbids.
- **Collation derivation tree** [M3, M4]: expression tree with each node labelled explicit/implicit/default/indeterminate, following the three combination rules; reproduce the `a < b` error and its COLLATE fix, `a || b` OK but `ORDER BY a || b` error.
- **ICU strength levels** [M2]: Table 23.1 grid; the user picks ks level and sees which pairs ('n'='ñ', 'g'='G', 'x-y'='x_y', 'ab' vs U&'a\2063b') compare equal.

### Playground SQL (PGlite, PG 18, single session)

```sql
-- GUC introspection: type, unit, context, source, enum values
SELECT name, setting, unit, vartype, context, source, enumvals, boot_val, reset_val, pending_restart
FROM pg_settings WHERE name IN ('shared_buffers','work_mem','wal_buffers','io_method','random_page_cost','synchronous_commit');

-- unit conversion and rounding rules (19.1.1)
SET work_mem = '30.1MB'; SHOW work_mem;         -- rounded to kB
SET statement_timeout = '1.5min'; SHOW statement_timeout;
SET work_mem TO DEFAULT;
SELECT set_config('work_mem', '64MB', true);    -- is_local => like SET LOCAL

-- UPDATE pg_settings == SET
UPDATE pg_settings SET setting = reset_val WHERE name = 'work_mem';

-- context categories inventory
SELECT context, count(*) FROM pg_settings GROUP BY context ORDER BY 2 DESC;

-- planner flags and cost constants
SELECT name, setting FROM pg_settings WHERE name LIKE 'enable_%' ORDER BY name;
CREATE TABLE t AS SELECT g AS id, md5(g::text) AS v FROM generate_series(1,100000) g;
CREATE INDEX ON t(id); ANALYZE t;
EXPLAIN SELECT * FROM t WHERE id < 5000;
SET random_page_cost = 1.1; EXPLAIN SELECT * FROM t WHERE id < 5000;
SET enable_indexscan = off; SET enable_bitmapscan = off; EXPLAIN SELECT * FROM t WHERE id < 5000;
RESET ALL;

-- work_mem spill to temp files (log_temp_files is the documented observer)
SET work_mem = '64kB';
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM t ORDER BY v;   -- "Sort Method: external merge  Disk: ..."
SET work_mem = '64MB';
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM t ORDER BY v;   -- quicksort in memory

-- join_collapse_limit = 1 freezes explicit join order
SET join_collapse_limit = 1;

-- synchronous_commit is per transaction
BEGIN; SET LOCAL synchronous_commit TO off; INSERT INTO t VALUES (0,'x'); COMMIT;

-- preset (read-only) options
SELECT name, setting FROM pg_settings WHERE context = 'internal' ORDER BY name;
SHOW block_size; SHOW wal_segment_size; SHOW max_identifier_length; SHOW segment_size;

-- custom two-part options as session variables
SET myapp.tenant_id = '42'; SELECT current_setting('myapp.tenant_id'), current_setting('myapp.missing', true);

-- roles: attributes, membership flags (doc example)
CREATE ROLE joe LOGIN; CREATE ROLE admin; CREATE ROLE wheel; CREATE ROLE island;
GRANT admin TO joe WITH INHERIT TRUE;
GRANT wheel TO admin WITH INHERIT FALSE;
GRANT island TO joe WITH INHERIT TRUE, SET FALSE;
SELECT r.rolname AS role, m.rolname AS member, a.admin_option, a.inherit_option, a.set_option
FROM pg_auth_members a JOIN pg_roles r ON r.oid = a.roleid JOIN pg_roles m ON m.oid = a.member;
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication, rolbypassrls, rolconnlimit FROM pg_roles;
SELECT pg_has_role('joe','wheel','USAGE') AS inherits_wheel, pg_has_role('joe','island','SET') AS can_set_island;
SELECT rolname FROM pg_roles WHERE rolname LIKE 'pg\_%' ORDER BY 1;   -- predefined roles

-- per-role and per-database defaults
ALTER ROLE joe SET enable_indexscan TO off;
SELECT * FROM pg_db_role_setting;

-- password hashing (SCRAM verifier format)
SET password_encryption = 'scram-sha-256';
CREATE ROLE pwdemo LOGIN PASSWORD 'secret';
SELECT rolname, left(rolpassword, 14) FROM pg_authid WHERE rolname = 'pwdemo';   -- needs superuser in PGlite

-- dropping a role that owns things
CREATE TABLE owned_by_joe(i int); ALTER TABLE owned_by_joe OWNER TO joe;
REASSIGN OWNED BY joe TO CURRENT_USER; DROP OWNED BY joe; DROP ROLE joe;

-- databases, templates, tablespaces (catalog reads)
SELECT datname, datistemplate, datallowconn, pg_encoding_to_char(encoding), datlocprovider, datcollate, datctype FROM pg_database;
SELECT spcname, pg_tablespace_location(oid) FROM pg_tablespace;   -- pg_default, pg_global

-- collations: derivation, standard collations, ICU (if built)
CREATE TABLE test1 (a text COLLATE "C", b text COLLATE "POSIX");
SELECT a < b FROM test1;               -- error: distinct collation objects are incompatible / indeterminate
SELECT a < b COLLATE "C" FROM test1;   -- fixed
SELECT collname, collprovider, collisdeterministic FROM pg_collation WHERE collname IN ('C','POSIX','ucs_basic','unicode','pg_c_utf8','pg_unicode_fast','default');
SELECT upper('ß' COLLATE pg_c_utf8), upper('ß' COLLATE pg_unicode_fast);   -- simple vs full case mapping
CREATE COLLATION ci (provider = icu, locale = 'und-u-ks-level2', deterministic = false);
SELECT 'aB' = 'Ab' COLLATE ci;
CREATE COLLATION num (provider = icu, locale = 'und-u-kn');
SELECT x FROM (VALUES ('id-123'),('id-45')) v(x) ORDER BY x COLLATE num;

-- encodings
SHOW server_encoding; SHOW client_encoding;
SELECT conname, pg_encoding_to_char(conforencoding), pg_encoding_to_char(contoencoding) FROM pg_conversion LIMIT 10;
SELECT convert_to('é', 'LATIN1'), octet_length('é'), length('é');

-- statistics knobs
SET track_io_timing = on; EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM t;
SHOW stats_fetch_consistency;
```

### Pitfalls the docs explicitly warn about (with documented fix)

- Default initdb authentication is `trust`, so any local user can become superuser -> use `initdb -A scram-sha-256` with `-W`/`--pwprompt`, or edit pg_hba.conf before first start (18.2).
- pg_hba.conf has no fall-through: a matching line whose method fails denies the connection -> order lines from specific/weak to broad/strong (20.1).
- Editing pg_hba.conf/pg_ident.conf/postgresql.conf has no effect until reload -> `pg_ctl reload` / `SELECT pg_reload_conf()`; pre-check with `pg_hba_file_rules`, `pg_ident_file_mappings`, `pg_file_settings` (19.1, 20.1, 20.2).
- Changes to postmaster-context parameters are ignored until restart, and invalid lines are silently ignored (logged) at SIGHUP (19.1.2).
- Setting `statement_timeout`, `lock_timeout` or `transaction_timeout` in postgresql.conf affects all sessions -> set per role/session instead (19.11.1).
- `fsync = off` risks unrecoverable corruption; "High quality hardware alone is not a sufficient justification" -> use `synchronous_commit = off` for most of the benefit without corruption risk (19.5.1).
- `full_page_writes = off` risks unrecoverable or silent corruption (19.5.1).
- `wal_level = minimal` makes earlier base backups useless for PITR and standbys, and the server will not start if max_wal_senders > 0 (19.5.1).
- `archive_command = '/bin/true'` breaks the WAL chain needed for archive recovery (19.5.3); very short `archive_timeout` bloats the archive because switched files are full-size.
- `recovery_target_action = shutdown` leaves recovery.signal, so every later start shuts down immediately -> change the config or remove the file (19.5.6).
- `work_mem` is per sort/hash operation, per session, per parallel worker; total memory can be many times larger -> size conservatively; raise `hash_mem_multiplier` for hash spills (19.4.1).
- Autovacuum can allocate `autovacuum_max_workers` x maintenance_work_mem -> set `autovacuum_work_mem` (19.4.1).
- `max_stack_depth` above the kernel limit lets runaway recursion crash a backend -> kernel `ulimit -s` minus ~1 MB (19.4.1).
- Transparent huge pages (THP) degrade performance for some users -> discouraged; use explicit `huge_pages` (19.4.1).
- `shared_memory_type = sysv` needs non-default kernel limits -> keep the default mmap (19.4.1, 18.4.1).
- systemd `RemoveIPC=yes` randomly deletes PostgreSQL's shared memory (e.g. parallel query segments) -> create postgres as a system user or set `RemoveIPC=no` (18.4.2).
- Linux OOM killer can kill the postmaster -> `vm.overcommit_memory=2`, `oom_score_adj=-1000` for the postmaster with `PG_OOM_ADJUST_FILE`/`PG_OOM_ADJUST_VALUE=0` for children, fewer connections plus pooling (18.4.4).
- SIGKILL on the postmaster leaks shared memory/semaphores and orphans children -> use SIGTERM/SIGINT/SIGQUIT via pg_ctl (18.5).
- systemd's default 90 s start timeout can kill a server still in crash recovery -> `TimeoutSec=infinity` (18.3).
- "No space left on device" from semget is about semaphores, not disk -> raise SEMMNI/SEMMNS or lower max_connections (18.3.1, 18.4.1).
- NFS mounted `soft` causes I/O errors; NFS server without the `sync` export option may lose fsynced data -> mount `hard`, export `sync` (18.2.2.1).
- A mount point used directly as the data directory causes permission problems and unclean failures -> create a subdirectory (18.2.1).
- Changing the OS collation library (OS upgrade, binary replication to a different OS, snapshot restore) can corrupt index ordering for non-C locales (18.2).
- LC_COLLATE/LC_CTYPE are fixed per database; non-C locales slow text handling and stop plain indexes serving LIKE -> `text_pattern_ops` or C-collation indexes (23.1.2).
- Only template0 can be cloned with a different encoding/locale; CREATE DATABASE fails if other sessions are connected to the template (22.3).
- CREATE DATABASE does not copy database-level GRANTs (22.3).
- Tablespaces cannot be backed up or moved to another cluster on their own; losing one can stop the cluster; never on a RAM disk (22.6).
- `REASSIGN OWNED` and `DROP OWNED` act on one database only and must run in each database, in that order (21.4).
- Role attributes (LOGIN, SUPERUSER, CREATEDB, CREATEROLE) are never inherited; you must SET ROLE (21.3).
- `pg_read_server_files`, `pg_write_server_files`, `pg_execute_server_program` can be used to gain superuser-level access (21.5).
- Trojan horse risk from functions/triggers/RLS -> keep schemas writable by untrusted users out of search_path (21.6, 19.11.1).
- `session_replication_role = replica` disables foreign key checks (FKs are triggers) (19.11.1).
- `synchronize_seqscans` means queries without ORDER BY can return rows in a changing order (19.13.1).
- `allow_alter_system = off` is not a security feature (19.13.2).
- `log_statement` can log plaintext passwords; log files should not be world-readable (19.8.3).
- `log_statement = all` still does not log statements with simple syntax errors -> use `log_min_error_statement` (19.8.3).
- `hot_standby_feedback` removes query cancels but can bloat the primary; `recovery_min_apply_delay` with `synchronous_commit = remote_apply` makes every COMMIT wait (19.6.3).
- `max_slot_wal_keep_size = -1` (default) lets slots retain unlimited WAL (19.6.1).
- Standby settings max_connections, max_prepared_transactions, max_worker_processes, max_wal_senders, max_locks_per_transaction must be >= the primary's, otherwise queries are not allowed on the standby (19.3-19.12).
- `zero_damaged_pages` destroys the rows on damaged pages, and zeroed pages are not forced to disk -> recreate the table/index before turning it off (19.17).
- `data_sync_retry = on` can silently lose data after a write-back failure on some OSes; the default PANIC plus WAL recovery is the safe path (19.14).
- MD5 passwords are deprecated; with differing scram_iterations an unauthenticated user can detect that a role exists (19.3.3, 20.5).
- ident trusts the client machine; RFC 1413 "is not intended as an authorization or access control protocol" (20.8).
- SCRAM over a network can still be intercepted by a spoofed server -> SSL with verify-full plus `channel_binding=require` (18.7).
- Nondeterministic collations cost performance, disable B-tree deduplication and some pattern matching (23.2.2.4).
- SQL_ASCII performs no conversion or validation, "a declaration of ignorance about the encoding" (23.3.1).
- `C` and `POSIX` collations are distinct objects and cannot be mixed in one comparison even though they behave identically (23.2.2.2.1).
