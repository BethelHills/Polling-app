# 🗄️ Database Migration Guide

## 🎯 **Unique Vote Constraint Migration**

This guide helps you add the unique constraint to prevent duplicate votes in your existing database.

### **📋 What This Migration Does:**

- **Prevents Duplicate Votes**: Users can only vote once per poll
- **Database Integrity**: Ensures data consistency
- **Security Enhancement**: Prevents vote manipulation

### **🔧 Migration Options:**

#### **Option 1: Safe Migration (Recommended)**

```sql
-- Run this in your Supabase SQL editor
-- This checks for existing constraint and adds it safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_user_poll_vote'
    ) THEN
        ALTER TABLE votes ADD CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id);
        RAISE NOTICE 'Added unique constraint: unique_user_poll_vote';
    ELSE
        RAISE NOTICE 'Constraint unique_user_poll_vote already exists';
    END IF;
END $$;
```

#### **Option 2: Clean Migration (If you have duplicates)**

```sql
-- First, remove any duplicate votes
DELETE FROM votes
WHERE id NOT IN (
    SELECT MIN(id)
    FROM votes
    GROUP BY poll_id, user_id
);

-- Then add the constraint
ALTER TABLE votes ADD CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id);
```

#### **Option 3: Full Schema Update**

```sql
-- Use the complete updated schema
-- This includes RLS policies and all constraints
-- (See database-schema-updated.sql)
```

### **🚀 How to Apply the Migration:**

#### **1. Via Supabase Dashboard:**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the migration SQL
4. Click **Run** to execute

#### **2. Via Supabase CLI:**

```bash
# If you have Supabase CLI installed
supabase db reset
# or
supabase db push
```

#### **3. Via psql (Direct Database Access):**

```bash
psql -h your-db-host -U postgres -d postgres -f migrations/add-unique-vote-constraint.sql
```

### **✅ Verification Steps:**

#### **1. Check Constraint Exists:**

```sql
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'unique_user_poll_vote';
```

#### **2. Test Duplicate Prevention:**

```sql
-- This should fail after migration
INSERT INTO votes (poll_id, user_id, option_id)
VALUES ('poll-uuid', 'user-uuid', 'option-uuid');

-- Try to insert the same vote again - should fail
INSERT INTO votes (poll_id, user_id, option_id)
VALUES ('poll-uuid', 'user-uuid', 'option-uuid');
```

### **🛡️ Security Benefits:**

1. **Prevents Vote Manipulation**: Users can't vote multiple times
2. **Data Integrity**: Ensures consistent vote counts
3. **Audit Trail**: Clear voting history per user
4. **Performance**: Indexed constraint improves query performance

### **⚠️ Important Notes:**

- **Backup First**: Always backup your database before migrations
- **Test Environment**: Test migrations in a development environment first
- **Existing Data**: Check for duplicate votes before applying constraint
- **Application Code**: Update your application to handle constraint violations gracefully

### **🔧 Application Code Updates:**

Your `voteHandler` function should handle the unique constraint violation:

```typescript
// In your voteHandler function
try {
  const { data, error } = await supabase.from("votes").insert([voteData]);

  if (error) {
    // Handle unique constraint violation
    if (error.code === "23505") {
      // Unique violation
      return { error: "User has already voted on this poll" };
    }
    return { error: "Failed to submit vote" };
  }

  return { success: true, data };
} catch (error) {
  return { error: "An unexpected error occurred" };
}
```

### **📊 Expected Results:**

After successful migration:

- ✅ Users can only vote once per poll
- ✅ Duplicate vote attempts return proper error messages
- ✅ Vote counts remain accurate
- ✅ Database performance improves with indexed constraint

### **🆘 Troubleshooting:**

#### **If Migration Fails:**

1. **Check for Duplicates**: Run duplicate detection query
2. **Clean Data**: Remove duplicates before applying constraint
3. **Check Permissions**: Ensure you have ALTER TABLE permissions
4. **Verify Table Structure**: Ensure votes table exists with correct columns

#### **Common Error Messages:**

- `relation "votes" does not exist`: Create the votes table first
- `duplicate key value violates unique constraint`: Remove duplicates first
- `permission denied`: Check your database user permissions

Your database will be more secure and consistent after applying this migration! 🎉
