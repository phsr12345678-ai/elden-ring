import { db } from '../lib/db';
// SQLite CHECK-equivalent guards for direct database writes as well as API validation.
try {
 for(const action of ['INSERT','UPDATE'])await db.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS entry_scope_${action.toLowerCase()}
 BEFORE ${action} ON Entry BEGIN
 SELECT CASE WHEN NEW.content_type NOT IN ('base_game','shadow_of_the_erdtree') THEN RAISE(ABORT,'invalid content_type') END;
 SELECT CASE WHEN NEW.verification_status NOT IN ('verified','needs_review') THEN RAISE(ABORT,'invalid verification_status') END;
 END`);
 console.log('SQLite scope constraints active.');
} finally {await db.$disconnect();}
