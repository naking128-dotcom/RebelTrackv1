-- ============================================================
-- RebelTrack — Migration 002
-- Add gender/division support to departments
-- ============================================================

create type dept_gender as enum ('mens', 'womens', 'coed');

alter table departments
  add column if not exists sport_group  text,        -- parent sport name e.g. "Basketball"
  add column if not exists gender       dept_gender, -- mens / womens / coed
  add column if not exists icon         text,        -- emoji icon
  add column if not exists color        text,        -- hex brand color
  add column if not exists sort_order   integer default 0;

-- Clear existing dept seed and rebuild with gender structure
delete from departments;

-- ============================================================
-- SPORTS with gender programs
-- ============================================================

-- Football (mens only)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ('Football', 'Football', 'mens', '🏈', '#CE1126', 1);

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Football', 'mens', '🏈', '#CE1126', p.id, s.ord
from (values
  ('Offense', 1), ('Defense', 2), ('Special Teams', 3),
  ('Strength & Conditioning', 4), ('Recruiting', 5), ('Film & Analytics', 6)
) as s(name, ord)
cross join (select id from departments where name='Football') p;

-- Basketball (mens + womens)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ("Men's Basketball",    'Basketball', 'mens',   '🏀', '#185FA5', 2),
  ("Women's Basketball",  'Basketball', 'womens', '🏀', '#185FA5', 2);

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select sub.name, 'Basketball', 'mens', '🏀', '#185FA5', p.id, sub.ord
from (values ('Scouting', 1), ('Player Development', 2), ("Men's Roster", 3)) as sub(name, ord)
cross join (select id from departments where name="Men's Basketball") p;

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select sub.name, 'Basketball', 'womens', '🏀', '#185FA5', p.id, sub.ord
from (values ('Recruiting', 1), ('Analytics', 2), ("Women's Roster", 3)) as sub(name, ord)
cross join (select id from departments where name="Women's Basketball") p;

-- Baseball (mens only)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ('Baseball', 'Baseball', 'mens', '⚾', '#3B6D11', 3);

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Baseball', 'mens', '⚾', '#3B6D11', p.id, s.ord
from (values ('Pitching', 1), ('Position Players', 2), ('Analytics', 3), ('Bullpen', 4)) as s(name, ord)
cross join (select id from departments where name='Baseball') p;

-- Softball (womens only)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ('Softball', 'Softball', 'womens', '🥎', '#854F0B', 4);

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Softball', 'womens', '🥎', '#854F0B', p.id, s.ord
from (values ('Pitching', 1), ('Position Players', 2), ('Recruiting', 3)) as s(name, ord)
cross join (select id from departments where name='Softball') p;

-- Tennis (mens + womens)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ("Men's Tennis",    'Tennis', 'mens',   '🎾', '#534AB7', 5),
  ("Women's Tennis",  'Tennis', 'womens', '🎾', '#534AB7', 5);

-- Golf (mens + womens)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ("Men's Golf",    'Golf', 'mens',   '⛳', '#C8A96E', 6),
  ("Women's Golf",  'Golf', 'womens', '⛳', '#C8A96E', 6);

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select 'Course Support', 'Golf', 'coed', '⛳', '#C8A96E', p.id, 1
from (select id from departments where name="Men's Golf") p;

-- Track & Field (mens + womens + shared)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ("Men's Track & Field",    'Track & Field', 'mens',   '🏃', '#1D9E75', 7),
  ("Women's Track & Field",  'Track & Field', 'womens', '🏃', '#1D9E75', 7),
  ('Track & Field (Shared)', 'Track & Field', 'coed',   '🏃', '#1D9E75', 7);

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Track & Field', 'mens', '🏃', '#1D9E75', p.id, s.ord
from (values ('Sprints', 1), ('Distance', 2), ('Field Events', 3)) as s(name, ord)
cross join (select id from departments where name="Men's Track & Field") p;

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Track & Field', 'womens', '🏃', '#1D9E75', p.id, s.ord
from (values ('Sprints', 1), ('Distance', 2), ('Field Events', 3)) as s(name, ord)
cross join (select id from departments where name="Women's Track & Field") p;

-- Swimming & Diving (mens + womens)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ("Men's Swimming & Diving",    'Swimming & Diving', 'mens',   '🏊', '#0C447C', 8),
  ("Women's Swimming & Diving",  'Swimming & Diving', 'womens', '🏊', '#0C447C', 8);

-- Volleyball (womens only)
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ('Volleyball', 'Volleyball', 'womens', '🏐', '#D85A30', 9);

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Volleyball', 'womens', '🏐', '#D85A30', p.id, s.ord
from (values ('Roster', 1), ('Recruiting', 2)) as s(name, ord)
cross join (select id from departments where name='Volleyball') p;

-- ============================================================
-- Non-sport / administrative departments (coed)
-- ============================================================
insert into departments (name, sport_group, gender, icon, color, sort_order) values
  ('IT & Technology', 'IT & Technology', 'coed', '💻', '#888780', 20),
  ('Facilities',      'Facilities',      'coed', '🏟', '#444441', 21),
  ('Business Office', 'Business Office', 'coed', '📋', '#14213D', 22);

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'IT & Technology', 'coed', '💻', '#888780', p.id, s.ord
from (values ('Infrastructure', 1), ('AV Support', 2), ('Cybersecurity', 3)) as s(name, ord)
cross join (select id from departments where name='IT & Technology') p;

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Facilities', 'coed', '🏟', '#444441', p.id, s.ord
from (values ('Field Operations', 1), ('Maintenance', 2), ('Event Setup', 3)) as s(name, ord)
cross join (select id from departments where name='Facilities') p;

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select s.name, 'Business Office', 'coed', '📋', '#14213D', p.id, s.ord
from (values ('Purchasing', 1), ('Payroll', 2), ('Compliance', 3)) as s(name, ord)
cross join (select id from departments where name='Business Office') p;

-- ============================================================
-- API helper: get dept tree grouped by sport
-- ============================================================
create or replace function get_dept_tree()
returns json language sql stable as $$
  select json_agg(sport_group order by min_sort) from (
    select
      sport_group,
      min(sort_order) as min_sort,
      json_agg(
        json_build_object(
          'id',         id,
          'name',       name,
          'gender',     gender,
          'icon',       icon,
          'color',      color,
          'parent_id',  parent_id,
          'sort_order', sort_order
        ) order by sort_order, name
      ) as departments
    from departments
    group by sport_group
  ) grouped;
$$;
