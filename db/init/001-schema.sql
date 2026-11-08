CREATE TABLE clients (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    email text UNIQUE,
    phone text UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE owners (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    -- free text on purpose: the function/title shown on screen; no CHECK or lookup table
    role text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- draft: not sent yet · sent: waiting for an answer · negotiating: client replied
-- no_response: sent but no reply after X days (derived on read by the app) · won · lost

CREATE TABLE quotes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id bigint NOT NULL REFERENCES clients (id),
    owner_id bigint NOT NULL REFERENCES owners (id),
    description text NOT NULL,
    total numeric(12, 2) NOT NULL CHECK (total > 0),
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'negotiating', 'no_response', 'won', 'lost')),
    -- null while the quote is a draft; the "X days" count starts here
    sent_at date,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK ((status = 'draft') = (sent_at IS NULL))
);

CREATE INDEX quotes_client_id_idx ON quotes (client_id);
CREATE INDEX quotes_owner_id_idx ON quotes (owner_id);

CREATE TABLE follow_ups (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quote_id bigint NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
    contacted_at date NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX follow_ups_quote_id_idx ON follow_ups (quote_id, contacted_at);


