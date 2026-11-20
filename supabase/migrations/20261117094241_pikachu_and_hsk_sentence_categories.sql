-- Keep legacy score groups; new rules never mix with the old unrestricted board.
create or replace function game_private.valid_category(p_game text,p_category text) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce((p_game='typing' and p_category ~ '^[1-4]:(easy|medium|hard):(guided|hanzi|vietnamese)$')
   or (p_game='matching' and p_category ~ '^(all|hsk[1-6]|hsk79|factory):(6|8|10|12):(pinyin|hanzi)(:pikachu-(same|meaning))?$')
   or (p_game='sentences' and (p_category in ('basic','daily','factory') or p_category ~ '^hsk[1-6]$')),false)
$$;
