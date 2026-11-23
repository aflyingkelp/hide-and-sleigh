import {sqliteTable,text,real,integer,index} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{code:text('code').primaryKey(),host:text('host').notNull(),seeker:text('seeker'),phase:text('phase').notNull().default('lobby'),starts:real('starts').notNull().default(0),expires:real('expires').notNull(),round:integer('round').notNull().default(0),winner:text('winner')});
export const players=sqliteTable('players',{id:text('id').primaryKey(),token:text('token').notNull(),room:text('room').notNull().references(()=>rooms.code,{onDelete:'cascade'}),name:text('name').notNull(),x:real('x').notNull().default(0),z:real('z').notNull().default(0),yaw:real('yaw').notNull().default(0),pitch:real('pitch').notNull().default(0),prop:integer('prop').notNull().default(-1),caught:integer('caught').notNull().default(0),seen:real('seen').notNull(),light:integer('light').notNull().default(0),tagged:real('tagged').notNull().default(0),rocket:text('rocket'),taunt:text('taunt')},t=>[index('players_room_idx').on(t.room)]);


export const traps=sqliteTable('traps',{
 id:text('id').primaryKey(),
 room:text('room').notNull().references(()=>rooms.code,{onDelete:'cascade'}),
 round:integer('round').notNull(),
 x:real('x').notNull(),
 z:real('z').notNull(),
 placed:real('placed').notNull(),
 victim:text('victim'),
 triggered:real('triggered'),
 result:text('result'),
 resolved:real('resolved')
},t=>[index('traps_room_idx').on(t.room,t.round)]);

export const sledMatches=sqliteTable('sled_matches',{
 room:text('room').primaryKey().references(()=>rooms.code,{onDelete:'cascade'}),
 state:text('state').notNull(),
 version:integer('version').notNull().default(0)
});
