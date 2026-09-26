-- Migration : bannière admin (suppression de challenge + masquage des dépôts)
-- À coller dans Supabase > SQL Editor > New query > Run
-- (uniquement si votre base a été créée AVANT cet ajout ; un nouveau projet
-- qui exécute schema.sql en entier a déjà tout ça)

alter table challenges
  add column if not exists hide_repo_links boolean not null default false;

create policy "challenges supprimes par un prof" on challenges for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'prof'));
