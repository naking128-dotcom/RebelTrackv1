-- ============================================================
-- RebelTrack — Ole Miss Athletics
-- Migration 002: Ole Miss departments seed + department tree helper
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

insert into departments (name, sport_group, gender, icon, color, sort_order)
select
  seed.name,
  seed.sport_group,
  seed.gender::dept_gender,
  seed.icon,
  seed.color,
  seed.sort_order
from (values
  ('Football', 'Football', 'mens', '🏈', '#CE1126', 10),
  ('Men''s Basketball', 'Basketball', 'mens', '🏀', '#185FA5', 20),
  ('Women''s Basketball', 'Basketball', 'womens', '🏀', '#185FA5', 20),
  ('Men''s Golf', 'Golf', 'mens', '⛳', '#3B6D11', 30),
  ('Women''s Golf', 'Golf', 'womens', '⛳', '#3B6D11', 30),
  ('Soccer', 'Soccer', 'womens', '⚽', '#854F0B', 40),
  ('Men''s Track & Field', 'Track & Field', 'mens', '🏃', '#1D9E75', 50),
  ('Women''s Track & Field', 'Track & Field', 'womens', '🏃', '#1D9E75', 50),
  ('Volleyball', 'Volleyball', 'womens', '🏐', '#534AB7', 60),
  ('Rifle', 'Rifle', 'coed', '🎯', '#C8A96E', 70),
  ('Softball', 'Softball', 'womens', '🥎', '#D85A30', 80),
  ('Baseball', 'Baseball', 'mens', '⚾', '#0C447C', 90),
  ('Compliance', 'Compliance', 'coed', '⚖', '#444441', 200),
  ('Business Office', 'Business Office', 'coed', '💼', '#14213D', 210),
  ('Information Technology', 'Information Technology', 'coed', '💻', '#888780', 220),
  ('Marketing', 'Marketing', 'coed', '📢', '#854F0B', 230),
  ('Media Relations', 'Media Relations', 'coed', '📰', '#534AB7', 240),
  ('Productions', 'Productions', 'coed', '🎬', '#1D9E75', 250),
  ('Facilities', 'Facilities', 'coed', '🏟', '#3B6D11', 260),
  ('Administrative', 'Administrative', 'coed', '📋', '#CE1126', 270)
) as seed(name, sport_group, gender, icon, color, sort_order)
where not exists (
  select 1 from departments d
  where d.parent_id is null and lower(d.name) = lower(seed.name)
);

insert into departments (name, sport_group, gender, icon, color, parent_id, sort_order)
select
  s.name,
  s.sport_group,
  s.gender::dept_gender,
  s.icon,
  s.color,
  p.id,
  s.sort_order
from (values
  ('Offense','Football','mens','🏈','#CE1126','Football',1),
  ('Defense','Football','mens','🏈','#CE1126','Football',2),
  ('Special Teams','Football','mens','🏈','#CE1126','Football',3),
  ('Strength & Conditioning','Football','mens','🏈','#CE1126','Football',4),
  ('Recruiting','Football','mens','🏈','#CE1126','Football',5),
  ('Film & Analytics','Football','mens','🏈','#CE1126','Football',6),
  ('Equipment','Football','mens','🏈','#CE1126','Football',7),

  ('Scouting','Basketball','mens','🏀','#185FA5','Men''s Basketball',1),
  ('Player Development','Basketball','mens','🏀','#185FA5','Men''s Basketball',2),
  ('Video','Basketball','mens','🏀','#185FA5','Men''s Basketball',3),
  ('Recruiting','Basketball','mens','🏀','#185FA5','Men''s Basketball',4),

  ('Scouting','Basketball','womens','🏀','#185FA5','Women''s Basketball',1),
  ('Player Development','Basketball','womens','🏀','#185FA5','Women''s Basketball',2),
  ('Video','Basketball','womens','🏀','#185FA5','Women''s Basketball',3),
  ('Recruiting','Basketball','womens','🏀','#185FA5','Women''s Basketball',4),

  ('Pitching','Baseball','mens','⚾','#0C447C','Baseball',1),
  ('Position Players','Baseball','mens','⚾','#0C447C','Baseball',2),
  ('Analytics','Baseball','mens','⚾','#0C447C','Baseball',3),
  ('Equipment','Baseball','mens','⚾','#0C447C','Baseball',4),
  ('Recruiting','Baseball','mens','⚾','#0C447C','Baseball',5),

  ('Pitching','Softball','womens','🥎','#D85A30','Softball',1),
  ('Position Players','Softball','womens','🥎','#D85A30','Softball',2),
  ('Recruiting','Softball','womens','🥎','#D85A30','Softball',3),
  ('Equipment','Softball','womens','🥎','#D85A30','Softball',4),

  ('Sprints','Track & Field','mens','🏃','#1D9E75','Men''s Track & Field',1),
  ('Distance','Track & Field','mens','🏃','#1D9E75','Men''s Track & Field',2),
  ('Field Events','Track & Field','mens','🏃','#1D9E75','Men''s Track & Field',3),
  ('Recruiting','Track & Field','mens','🏃','#1D9E75','Men''s Track & Field',4),

  ('Sprints','Track & Field','womens','🏃','#1D9E75','Women''s Track & Field',1),
  ('Distance','Track & Field','womens','🏃','#1D9E75','Women''s Track & Field',2),
  ('Field Events','Track & Field','womens','🏃','#1D9E75','Women''s Track & Field',3),
  ('Recruiting','Track & Field','womens','🏃','#1D9E75','Women''s Track & Field',4),

  ('Roster','Soccer','womens','⚽','#854F0B','Soccer',1),
  ('Recruiting','Soccer','womens','⚽','#854F0B','Soccer',2),
  ('Analytics','Soccer','womens','⚽','#854F0B','Soccer',3),

  ('Roster','Volleyball','womens','🏐','#534AB7','Volleyball',1),
  ('Recruiting','Volleyball','womens','🏐','#534AB7','Volleyball',2),

  ('Roster','Golf','mens','⛳','#3B6D11','Men''s Golf',1),
  ('Tournament Logistics','Golf','mens','⛳','#3B6D11','Men''s Golf',2),
  ('Roster','Golf','womens','⛳','#3B6D11','Women''s Golf',1),
  ('Tournament Logistics','Golf','womens','⛳','#3B6D11','Women''s Golf',2),

  ('Smallbore','Rifle','coed','🎯','#C8A96E','Rifle',1),
  ('Air Rifle','Rifle','coed','🎯','#C8A96E','Rifle',2),
  ('Recruiting','Rifle','coed','🎯','#C8A96E','Rifle',3),

  ('Infrastructure','Information Technology','coed','💻','#888780','Information Technology',1),
  ('AV Support','Information Technology','coed','💻','#888780','Information Technology',2),
  ('Cybersecurity','Information Technology','coed','💻','#888780','Information Technology',3),
  ('Help Desk','Information Technology','coed','💻','#888780','Information Technology',4),

  ('Purchasing','Business Office','coed','💼','#14213D','Business Office',1),
  ('Payroll','Business Office','coed','💼','#14213D','Business Office',2),
  ('Accounts Payable','Business Office','coed','💼','#14213D','Business Office',3),
  ('Budget & Finance','Business Office','coed','💼','#14213D','Business Office',4),

  ('NCAA Compliance','Compliance','coed','⚖','#444441','Compliance',1),
  ('Eligibility','Compliance','coed','⚖','#444441','Compliance',2),
  ('Recruiting Rules','Compliance','coed','⚖','#444441','Compliance',3),

  ('Digital Marketing','Marketing','coed','📢','#854F0B','Marketing',1),
  ('Promotions','Marketing','coed','📢','#854F0B','Marketing',2),
  ('Sponsorships','Marketing','coed','📢','#854F0B','Marketing',3),
  ('Ticket Sales','Marketing','coed','📢','#854F0B','Marketing',4),

  ('Communications','Media Relations','coed','📰','#534AB7','Media Relations',1),
  ('Photography','Media Relations','coed','📰','#534AB7','Media Relations',2),
  ('Statistics','Media Relations','coed','📰','#534AB7','Media Relations',3),

  ('Video Production','Productions','coed','🎬','#1D9E75','Productions',1),
  ('Broadcast','Productions','coed','🎬','#1D9E75','Productions',2),
  ('Scoreboard Ops','Productions','coed','🎬','#1D9E75','Productions',3),
  ('Live Streaming','Productions','coed','🎬','#1D9E75','Productions',4),

  ('Field Operations','Facilities','coed','🏟','#3B6D11','Facilities',1),
  ('Maintenance','Facilities','coed','🏟','#3B6D11','Facilities',2),
  ('Event Setup','Facilities','coed','🏟','#3B6D11','Facilities',3),
  ('Grounds','Facilities','coed','🏟','#3B6D11','Facilities',4),

  ('Executive Office','Administrative','coed','📋','#CE1126','Administrative',1),
  ('Human Resources','Administrative','coed','📋','#CE1126','Administrative',2),
  ('Event Management','Administrative','coed','📋','#CE1126','Administrative',3)
) as s(name, sport_group, gender, icon, color, parent_name, sort_order)
join departments p
  on p.parent_id is null
 and lower(p.name) = lower(s.parent_name)
where not exists (
  select 1 from departments d
  where d.parent_id = p.id and lower(d.name) = lower(s.name)
);

create or replace function get_dept_tree()
returns json language sql stable as $$
  select coalesce(json_agg(payload order by sort_order), '[]'::json)
  from (
    select
      min(d1.sort_order) as sort_order,
      json_build_object(
        'sport_group', d1.sport_group,
        'icon', max(d1.icon),
        'color', max(d1.color),
        'sort_order', min(d1.sort_order),
        'genders', json_agg(distinct d1.gender order by d1.gender),
        'departments', (
          select coalesce(json_agg(
            json_build_object(
              'id', d2.id,
              'name', d2.name,
              'gender', d2.gender,
              'icon', d2.icon,
              'color', d2.color,
              'sort_order', d2.sort_order,
              'children', (
                select coalesce(json_agg(json_build_object(
                  'id', d3.id,
                  'name', d3.name,
                  'gender', d3.gender,
                  'sort_order', d3.sort_order
                ) order by d3.sort_order, d3.name), '[]'::json)
                from departments d3
                where d3.parent_id = d2.id
              )
            ) order by d2.gender, d2.sort_order, d2.name), '[]'::json)
          from departments d2
          where d2.sport_group = d1.sport_group
            and d2.parent_id is null
        )
      ) as payload
    from departments d1
    where d1.parent_id is null
    group by d1.sport_group
  ) grouped;
$$;
