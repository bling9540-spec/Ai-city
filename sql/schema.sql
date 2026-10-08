create table if not exists public.agents (
 id uuid primary key default gen_random_uuid(),
 external_agent_id text not null unique,
 public_number bigint generated always as identity unique,
 name text not null,
 block_id bigint unique,
 created_at timestamptz not null default now()
);
create table if not exists public.blocks (
 id bigint generated always as identity primary key,
 district integer not null,
 block_index integer not null,
 unique(district,block_index)
);
insert into public.blocks(district,block_index)
select 1,n from generate_series(1,576) n on conflict do nothing;
create or replace function public.register_agent(p_external_agent_id text,p_name text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.agents%rowtype; b bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_external_agent_id,0));
 select * into a from public.agents where external_agent_id=p_external_agent_id;
 if found then return to_jsonb(a); end if;
 select blocks.id into b from public.blocks
 where not exists(select 1 from public.agents where block_id=blocks.id)
 order by blocks.id limit 1 for update skip locked;
 if b is null then raise exception 'no_available_blocks'; end if;
 insert into public.agents(external_agent_id,name,block_id)
 values(p_external_agent_id,p_name,b) returning * into a;
 return to_jsonb(a);
end $$;
revoke all on function public.register_agent(text,text) from public,anon,authenticated;
alter table public.agents enable row level security;
alter table public.blocks enable row level security;