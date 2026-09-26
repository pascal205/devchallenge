-- ============================================================
-- DevChallenge — schéma de base de données (Postgres / Supabase)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Profils ----------
-- Un profil est créé automatiquement pour chaque nouvel utilisateur (trigger plus bas)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null default 'eleve' check (role in ('eleve','prof')),
  created_at  timestamptz not null default now()
);

create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- Challenges ----------
create table challenges (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null,
  -- critères notés par les pairs, ex: [{"id":"design","label":"Design","max":20}, ...]
  criteria     jsonb not null default '[]',
  -- pondération de la correction automatique, ex: [{"id":"lh","label":"Lighthouse","poids":30}, ...]
  auto_weights jsonb not null default '[]',
  peer_weight  int  not null default 50 check (peer_weight between 0 and 100),
  -- si vrai, les évaluateurs ne voient pas le lien du dépôt GitHub (seulement la démo),
  -- pour limiter le risque d'identifier l'auteur pendant la phase d'évaluation
  hide_repo_links boolean not null default false,
  deadline     timestamptz,
  status       text not null default 'draft'
               check (status in ('draft','open','locked','review','results')),
  created_by   uuid not null references profiles(id),
  created_at   timestamptz not null default now()
);

-- ---------- Soumissions ----------
create table submissions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references challenges(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  repo_url      text not null,
  demo_url      text not null,
  commit_hash   text,
  created_at    timestamptz not null default now(),
  unique (challenge_id, user_id)
);

-- ---------- Attribution des évaluations ----------
-- Qui doit noter quel projet (généré par assign_reviews ci-dessous)
create table review_assignments (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references challenges(id) on delete cascade,
  reviewer_id   uuid not null references profiles(id) on delete cascade,
  submission_id uuid not null references submissions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (reviewer_id, submission_id)
);

-- ---------- Évaluations rendues ----------
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  reviewer_id   uuid not null references profiles(id) on delete cascade,
  scores        jsonb not null,           -- ex: {"design":16,"ux":14,...}
  comment       text not null check (char_length(comment) >= 100),
  created_at    timestamptz not null default now(),
  unique (submission_id, reviewer_id)
);

-- ---------- Notes de la correction automatique ----------
create table auto_scores (
  submission_id uuid primary key references submissions(id) on delete cascade,
  scores        jsonb not null,           -- ex: {"lh":88,"w3c":100,...} chaque critère /100
  computed_at   timestamptz not null default now()
);

-- ============================================================
-- Sécurité (Row Level Security)
-- ============================================================

alter table profiles           enable row level security;
alter table challenges         enable row level security;
alter table submissions        enable row level security;
alter table review_assignments enable row level security;
alter table reviews            enable row level security;
alter table auto_scores        enable row level security;

-- profils : tout le monde connecté peut lire les noms (utile pour l'affichage),
-- chacun ne modifie que sa propre ligne
create policy "profils lisibles" on profiles for select using (auth.uid() is not null);
create policy "profil modifiable par son proprietaire" on profiles for update using (auth.uid() = id);

-- challenges : lecture ouverte aux connectés, écriture réservée aux profs
create policy "challenges lisibles" on challenges for select using (auth.uid() is not null);
create policy "challenges crees par un prof" on challenges for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'prof'));
create policy "challenges modifies par un prof" on challenges for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'prof'));
create policy "challenges supprimes par un prof" on challenges for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'prof'));

-- soumissions : chacun dépose la sienne tant que le challenge est ouvert
create policy "on voit les soumissions apres verrouillage ou la sienne" on submissions for select
  using (
    user_id = auth.uid()
    or exists (select 1 from challenges c where c.id = challenge_id and c.status <> 'draft' and c.status <> 'open')
  );
create policy "on depose seulement pour soi et challenge ouvert" on submissions for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from challenges c where c.id = challenge_id and c.status = 'open')
  );

-- attributions : chacun voit seulement ce qu'on lui a confié
create policy "on voit ses propres attributions" on review_assignments for select
  using (reviewer_id = auth.uid());
create policy "un prof peut attribuer" on review_assignments for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'prof'));

-- évaluations : on ne note que ce qui nous a été attribué, jamais son propre projet
create policy "on rend un avis seulement si attribue" on reviews for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from review_assignments ra
      where ra.reviewer_id = auth.uid() and ra.submission_id = reviews.submission_id
    )
  );
create policy "on relit ses propres avis" on reviews for select
  using (
    reviewer_id = auth.uid()
    or exists (
      -- l'auteur du projet peut lire les avis reçus une fois les résultats publiés
      select 1 from submissions s join challenges c on c.id = s.challenge_id
      where s.id = reviews.submission_id and s.user_id = auth.uid() and c.status = 'results'
    )
  );

-- notes automatiques : lecture par l'auteur une fois publiées ; écriture réservée
-- au script de correction (clé "service role", qui ignore RLS — donc pas de policy insert ici)
create policy "auteur lit sa note auto apres publication" on auto_scores for select
  using (
    exists (
      select 1 from submissions s join challenges c on c.id = s.challenge_id
      where s.id = auto_scores.submission_id and s.user_id = auth.uid() and c.status = 'results'
    )
  );

-- ============================================================
-- Fonctions métier
-- ============================================================

-- Tire au sort "n" projets à évaluer par élève (hors son propre projet),
-- appelée par un prof quand il verrouille un challenge.
create or replace function assign_reviews(p_challenge uuid, p_par_eleve int default 4)
returns void as $$
declare
  r record;
begin
  for r in select id as reviewer_id from submissions where challenge_id = p_challenge loop
    insert into review_assignments (challenge_id, reviewer_id, submission_id)
    select p_challenge, r.reviewer_id, s.id
    from submissions s
    where s.challenge_id = p_challenge and s.user_id <> r.reviewer_id
    order by random()
    limit p_par_eleve
    on conflict do nothing;
  end loop;
end;
$$ language plpgsql security definer;

-- Classement d'un challenge, avec anonymisation tant que le demandeur
-- n'a pas terminé toutes ses évaluations assignées.
create or replace function leaderboard(p_challenge uuid)
returns table (
  submission_id uuid,
  auteur        text,
  auto_score    numeric,
  peer_score    numeric,
  nb_avis       int,
  note_finale   numeric
) as $$
declare
  v_me uuid := auth.uid();
  v_restant int;
  v_peer_weight int;
begin
  select peer_weight into v_peer_weight from challenges where id = p_challenge;

  select count(*) into v_restant
  from review_assignments ra
  where ra.reviewer_id = v_me and ra.challenge_id = p_challenge
    and not exists (select 1 from reviews rv where rv.submission_id = ra.submission_id and rv.reviewer_id = v_me);

  return query
  with agg as (
    select
      s.id as submission_id,
      s.user_id,
      coalesce((select sum((a.scores->>(w->>'id'))::numeric * (w->>'poids')::numeric / 100)
                from auto_scores a, jsonb_array_elements(c.auto_weights) w
                where a.submission_id = s.id), 0) as auto_score,
      (select count(*) from reviews rv where rv.submission_id = s.id) as nb_avis,
      (select percentile_cont(0.5) within group (order by moy)
         from (
           select (select avg((rv.scores->>(cr->>'id'))::numeric)
                   from jsonb_array_elements(c.criteria) cr) as moy
           from reviews rv where rv.submission_id = s.id
         ) t) as moy_mediane
    from submissions s
    join challenges c on c.id = s.challenge_id
    where s.challenge_id = p_challenge
  )
  select
    a.submission_id,
    case when v_restant > 0 and a.user_id <> v_me then null
         else p.full_name end as auteur,
    round(a.auto_score,1),
    case when a.moy_mediane is null then null else round(a.moy_mediane * 5,1) end,
    a.nb_avis,
    round(
      a.auto_score * (100 - v_peer_weight) / 100.0
      + coalesce(a.moy_mediane * 5, 0) * v_peer_weight / 100.0
    ,1)
  from agg a join profiles p on p.id = a.user_id
  order by 6 desc;
end;
$$ language plpgsql security definer;

-- Progression d'un élève sur ses évaluations (pour la barre de progression)
create or replace function my_review_progress(p_challenge uuid)
returns table (fait int, total int) as $$
  select
    (select count(*) from review_assignments ra join reviews rv
       on rv.submission_id = ra.submission_id and rv.reviewer_id = ra.reviewer_id
     where ra.reviewer_id = auth.uid() and ra.challenge_id = p_challenge),
    (select count(*) from review_assignments where reviewer_id = auth.uid() and challenge_id = p_challenge);
$$ language sql security definer;
