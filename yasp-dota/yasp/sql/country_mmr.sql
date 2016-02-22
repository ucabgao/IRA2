SELECT loccountrycode, 
       count(*), 
       round(avg(solo_competitive_rank)) as avg
FROM   players 
       JOIN player_ratings 
         ON player_ratings.account_id = players.account_id
WHERE  loccountrycode IS NOT NULL 
       AND solo_competitive_rank IS NOT NULL
       AND time = (SELECT Max(time) 
                   FROM   player_ratings pr 
                   WHERE  players.account_id = pr.account_id)
GROUP  BY loccountrycode 
ORDER  BY avg DESC; 