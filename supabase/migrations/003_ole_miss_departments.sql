-- ============================================================
-- RebelTrack — Migration 003
-- Official Ole Miss Athletics Department List
-- ============================================================

-- Clear all existing department data (safe — POs use department_name text field)
delete from departments;

-- ============================================================
-- SPORTS — with gender breakdown
-- ============================================================

-- FOOTBALL (mens only)
insert into departments (name, sport_group, gender, icon, color, sort_order)
values ('Football', 'Football', 'mens', '🏈', '#CE1126', 10);

-- BASKETBALL (mens + womens — same tab)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ("Men's Basketball",   'Basketball', 'mens',   '🏀', '#185FA5', 20),
  ("Women's Basketball", 'Basketball', 'womens', '🏀', '#185FA5', 20);

-- GOLF (mens + womens — same tab)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ("Men's Golf",   'Golf', 'mens',   '⛳', '#3B6D11', 30),
  ("Women's Golf", 'Golf', 'womens', '⛳', '#3B6D11', 30);

-- SOCCER (womens only at Ole Miss)
insert into departments (name, sport_group, gender, icon, color, sort_order)
values ('Soccer', 'Soccer', 'womens', '⚽', '#854F0B', 40);

-- TRACK & FIELD (mens + womens — same tab)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ("Men's Track & Field",   'Track & Field', 'mens',   '🏃', '#1D9E75', 50),
  ("Women's Track & Field", 'Track & Field', 'womens', '🏃', '#1D9E75', 50);

-- VOLLEYBALL (womens only)
insert into departments (name, sport_group, gender, icon, color, sort_order)
values ('Volleyball', 'Volleyball', 'womens', '🏐', '#534AB7', 60);

-- RIFLE (coed — combined program)
insert into departments (name, sport_group, gender, icon, color, sort_order)
values ('Rifle', 'Rifle', 'coed', '🎯', '#C8A96E', 70);

-- SOFTBALL (womens only)
insert into departments (name, sport_group, gender, icon, color, sort_order)
values ('Softball', 'Softball', 'womens', '🥎', '#D85A30', 80);

-- BASEBALL (mens only)
insert into departments (name, sport_group, gender, icon, color, sort_order)
values ('Baseball', 'Baseball', 'mens', '⚾', '#0C447C', 90);

-- ============================================================
-- ADMINISTRATIVE / OPERATIONAL DEPARTMENTS
-- ============================================================

insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ('Compliance',          'Compliance',          'coed', '⚖',  '#444441', 200),
  ('Business Office',     'Business Office',     'coed', '💼', '#14213D', 210),
  ('Information Technology', 'Information Technology', 'coed', '💻', '#888780', 220),
  ('Marketing',           'Marketing',           'coed', '📢', '#854F0B', 230),
  ('Media Relations',     'Media Relations',     'coed', '📰', '#534AB7', 240),
  ('Productions',         'Productions',         'coed', '🎬', '#1D9E75', 250),
  ('Facilities',          'Facilities',          'coed', '🏟', '#3B6D11', 260),
  ('Administrative',      'Administrative',      'coed', '📋', '#CE1126', 270);

-- ============================================================
-- DEFAULT SUB-DEPARTMENTS per sport/dept
-- ============================================================

-- Football subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Football', 'mens', '🏈', '#CE1126', p.id, s.ord
from (values
  ('Offense',                  1),
  ('Defense',                  2),
  ('Special Teams',            3),
  ('Strength & Conditioning',  4),
  ('Recruiting',               5),
  ('Film & Analytics',         6),
  ('Equipment',                7)
) as s(name, ord)
cross join (select id from departments where name = 'Football') p;

-- Men's Basketball subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Basketball', 'mens', '🏀', '#185FA5', p.id, s.ord
from (values
  ('Scouting',           1),
  ('Player Development', 2),
  ('Video',              3),
  ('Recruiting',         4)
) as s(name, ord)
cross join (select id from departments where name = "Men's Basketball") p;

-- Women's Basketball subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Basketball', 'womens', '🏀', '#185FA5', p.id, s.ord
from (values
  ('Scouting',           1),
  ('Player Development', 2),
  ('Video',              3),
  ('Recruiting',         4)
) as s(name, ord)
cross join (select id from departments where name = "Women's Basketball") p;

-- Baseball subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Baseball', 'mens', '⚾', '#0C447C', p.id, s.ord
from (values
  ('Pitching',          1),
  ('Position Players',  2),
  ('Analytics',         3),
  ('Equipment',         4),
  ('Recruiting',        5)
) as s(name, ord)
cross join (select id from departments where name = 'Baseball') p;

-- Softball subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Softball', 'womens', '🥎', '#D85A30', p.id, s.ord
from (values
  ('Pitching',         1),
  ('Position Players', 2),
  ('Recruiting',       3),
  ('Equipment',        4)
) as s(name, ord)
cross join (select id from departments where name = 'Softball') p;

-- Men's Track & Field subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Track & Field', 'mens', '🏃', '#1D9E75', p.id, s.ord
from (values
  ('Sprints',      1),
  ('Distance',     2),
  ('Field Events', 3),
  ('Recruiting',   4)
) as s(name, ord)
cross join (select id from departments where name = "Men's Track & Field") p;

-- Women's Track & Field subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Track & Field', 'womens', '🏃', '#1D9E75', p.id, s.ord
from (values
  ('Sprints',      1),
  ('Distance',     2),
  ('Field Events', 3),
  ('Recruiting',   4)
) as s(name, ord)
cross join (select id from departments where name = "Women's Track & Field") p;

-- Soccer subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Soccer', 'womens', '⚽', '#854F0B', p.id, s.ord
from (values
  ('Roster',     1),
  ('Recruiting', 2),
  ('Analytics',  3)
) as s(name, ord)
cross join (select id from departments where name = 'Soccer') p;

-- Volleyball subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Volleyball', 'womens', '🏐', '#534AB7', p.id, s.ord
from (values
  ('Roster',     1),
  ('Recruiting', 2)
) as s(name, ord)
cross join (select id from departments where name = 'Volleyball') p;

-- Men's Golf subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Golf', 'mens', '⛳', '#3B6D11', p.id, s.ord
from (values ('Roster', 1), ('Tournament Logistics', 2)) as s(name, ord)
cross join (select id from departments where name = "Men's Golf") p;

-- Women's Golf subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Golf', 'womens', '⛳', '#3B6D11', p.id, s.ord
from (values ('Roster', 1), ('Tournament Logistics', 2)) as s(name, ord)
cross join (select id from departments where name = "Women's Golf") p;

-- Rifle subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Rifle', 'coed', '🎯', '#C8A96E', p.id, s.ord
from (values ('Smallbore', 1), ('Air Rifle', 2), ('Recruiting', 3)) as s(name, ord)
cross join (select id from departments where name = 'Rifle') p;

-- IT subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Information Technology', 'coed', '💻', '#888780', p.id, s.ord
from (values
  ('Infrastructure',  1),
  ('AV Support',      2),
  ('Cybersecurity',   3),
  ('Help Desk',       4)
) as s(name, ord)
cross join (select id from departments where name = 'Information Technology') p;

-- Business Office subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Business Office', 'coed', '💼', '#14213D', p.id, s.ord
from (values
  ('Purchasing', 1),
  ('Payroll',    2),
  ('Accounts Payable', 3),
  ('Budget & Finance', 4)
) as s(name, ord)
cross join (select id from departments where name = 'Business Office') p;

-- Compliance subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Compliance', 'coed', '⚖', '#444441', p.id, s.ord
from (values
  ('NCAA Compliance',  1),
  ('Eligibility',      2),
  ('Recruiting Rules', 3)
) as s(name, ord)
cross join (select id from departments where name = 'Compliance') p;

-- Marketing subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Marketing', 'coed', '📢', '#854F0B', p.id, s.ord
from (values
  ('Digital Marketing', 1),
  ('Promotions',        2),
  ('Sponsorships',      3),
  ('Ticket Sales',      4)
) as s(name, ord)
cross join (select id from departments where name = 'Marketing') p;

-- Media Relations subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Media Relations', 'coed', '📰', '#534AB7', p.id, s.ord
from (values
  ('Communications', 1),
  ('Photography',    2),
  ('Statistics',     3)
) as s(name, ord)
cross join (select id from departments where name = 'Media Relations') p;

-- Productions subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Productions', 'coed', '🎬', '#1D9E75', p.id, s.ord
from (values
  ('Video Production', 1),
  ('Broadcast',        2),
  ('Scoreboard Ops',   3),
  ('Live Streaming',   4)
) as s(name, ord)
cross join (select id from departments where name = 'Productions') p;

-- Facilities subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Facilities', 'coed', '🏟', '#3B6D11', p.id, s.ord
from (values
  ('Field Operations', 1),
  ('Maintenance',      2),
  ('Event Setup',      3),
  ('Grounds',          4)
) as s(name, ord)
cross join (select id from departments where name = 'Facilities') p;

-- Administrative subs
insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Administrative', 'coed', '📋', '#CE1126', p.id, s.ord
from (values
  ('Executive Office', 1),
  ('Human Resources',  2),
  ('Event Management', 3)
) as s(name, ord)
cross join (select id from departments where name = 'Administrative') p;

-- ============================================================
-- Refresh the dept tree function (unchanged, just re-confirm)
-- ============================================================
create or replace function get_dept_tree()
returns json language sql stable as $$
  select json_agg(
    json_build_object(
      'sport_group', sport_group,
      'icon',        max(icon),
      'color',       max(color),
      'sort_order',  min(sort_order),
      'genders',     json_agg(distinct gender),
      'departments', (
        select json_agg(
          json_build_object(
            'id',        d2.id,
            'name',      d2.name,
            'gender',    d2.gender,
            'icon',      d2.icon,
            'color',     d2.color,
            'parent_id', d2.parent_id,
            'sort_order',d2.sort_order,
            'children', (
              select json_agg(
                json_build_object(
                  'id',        d3.id,
                  'name',      d3.name,
                  'gender',    d3.gender,
                  'parent_id', d3.parent_id,
                  'sort_order',d3.sort_order
                ) order by d3.sort_order, d3.name
              )
              from departments d3
              where d3.parent_id = d2.id
            )
          ) order by d2.gender, d2.sort_order
        )
        from departments d2
        where d2.sport_group = d1.sport_group
          and d2.parent_id is null
      )
    ) order by min(sort_order), sport_group
  )
  from departments d1
  where parent_id is null
  group by sport_group;
$$;
