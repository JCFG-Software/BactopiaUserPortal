--
-- PostgreSQL database dump
--

-- Dumped from database version 14.9 (Homebrew)
-- Dumped by pg_dump version 14.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: registered_users; Type: TABLE DATA; Schema: public; Owner: bactbook
--

INSERT INTO public.registered_users VALUES ('example1@mail.com', 'John Doe', '$2b$10$qcPnWvdnwjcnQBAs2O/CGup0TNMrAuptq0Mis7BgzEt5CyDpzEOTS', '', '', NULL, NULL);
INSERT INTO public.registered_users VALUES ('example2@mail.com', 'Jane Doe','$2b$10$hK9RhuAWgVSRySD5kk/dI.B.jzM7lDSxtcpvlN8L4DWmzmi8tevfC', '', '', NULL, NULL);

--
-- Data for Name: group_samples; Type: TABLE DATA; Schema: public; Owner: bactbook
--

INSERT INTO public.group_samples VALUES (1, 'SRX4563687');
INSERT INTO public.group_samples VALUES (1, 'SRX4563690');
INSERT INTO public.group_samples VALUES (1, 'SRX4563682');
INSERT INTO public.group_samples VALUES (1, 'SRX4563689');
INSERT INTO public.group_samples VALUES (1, 'SRX4563681');


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: bactbook
--

INSERT INTO public.groups OVERRIDING SYSTEM VALUE VALUES (1, 'example1@mail.com', 'Study', '', '2023-09-15 11:26:12.448+10', '2023-09-17 21:25:15.666+10');

--
-- Data for Name: group_sharing; Type: TABLE DATA; Schema: public; Owner: bactbook
--

INSERT INTO public.group_sharing VALUES (1, '_public_all_users_');


--
-- Data for Name: metadata; Type: TABLE DATA; Schema: public; Owner: bactbook
--

INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (1, 'SRX4563690', '', 'Wound', '', '', '', '2023-09-15 11:28:21.856+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (2, 'SRX4563687', 'Human', 'Wound', 'USA', 'OCT 2014', '', '2023-09-15 12:57:09.681+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (3, 'SRX4563687', 'Human', 'Saliva', 'AUS', 'OCT 2014', '', '2023-09-15 13:10:00.943+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (4, 'SRX4563689', 'Human', 'Saliva', 'USA', '', '', '2023-09-15 15:21:05.672+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (5, 'SRX16357955', 'Human', '', '', '', '', '2023-09-16 22:26:10.445+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (6, 'SRX4563681', 'Human', '', '', '', '', '2023-09-17 16:34:50.964+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (7, 'ERX178736', 'Human', 'Wound', 'AUS', 'FEB 2023', '', '2023-09-18 11:43:39.7+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (8, 'SRX16357955', 'Human', 'Blood', 'USA', 'FEB 2023', '', '2023-09-18 11:44:03.38+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (9, 'SRX16357971', 'Unknown', 'Unknown', 'USA', 'OCT 2022', '', '2023-09-18 11:44:40.975+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (10, 'SRX18280334', 'Human', 'Wound', 'AUS', 'JUL 2022', '', '2023-09-18 11:45:03.978+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (11, 'SRX4563681', 'Human', 'Wound', 'USA', 'FEB 2023', '', '2023-09-18 11:45:22.47+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (12, 'SRX4563682', 'Unknown', 'Wound', 'AUS', 'FEB 2023', '', '2023-09-18 11:45:42.17+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (13, 'SRX4563687', 'Human', 'Wound', 'AUS', 'OCT 2014', '', '2023-09-18 11:45:56.29+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (14, 'SRX4563689', 'Human', 'Blood', 'USA', 'JUN 2022', '', '2023-09-18 11:46:15.408+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (15, 'SRX4563690', 'Human', 'Wound', 'AUS', 'AUG 2023', '', '2023-09-18 11:46:33.189+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (16, 'SRX6626021', 'Unknown', 'Unknown', 'Unknown', 'FEB 2023', '', '2023-09-18 11:48:19.813+10', 'example1@mail.com');
INSERT INTO public.metadata OVERRIDING SYSTEM VALUE VALUES (17, 'SRX6626021-SE', 'Human', 'Unknown', 'AUS', 'AUG 2023', '', '2023-09-18 11:48:36.118+10', 'example1@mail.com');


--
-- Data for Name: user_favorites; Type: TABLE DATA; Schema: public; Owner: bactbook
--



--
-- Name: groups_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bactbook
--

SELECT pg_catalog.setval('public.groups_group_id_seq', 1, true);


--
-- Name: metadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bactbook
--

SELECT pg_catalog.setval('public.metadata_id_seq', 17, true);


--
-- PostgreSQL database dump complete
--

