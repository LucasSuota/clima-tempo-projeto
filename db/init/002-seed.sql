-- Fictional seed data only (AGENTS.md §12). Dates are relative to CURRENT_DATE
-- so the stale/recent cases stay valid on any day the volume is created.

INSERT INTO clients (name, email, phone) VALUES
    ('Ana Souza',           'ana.souza@example.com',     '(11) 90000-0001'),
    ('Bruno Lima',          'bruno.lima@example.com',    '(11) 90000-0002'),
    ('Carla Mendes',        'carla.mendes@example.com',  '(11) 90000-0003'),
    ('Diego Ferreira',      NULL,                        NULL),
    ('Eva Martins',         'eva.martins@example.com',   '(11) 90000-0005'),
    ('Fábio Rocha',         NULL,                        '(11) 90000-0006'),
    ('Gisele Alves',        'gisele.alves@example.com',  '(11) 90000-0007'),
    ('Hélio Barros',        'helio.barros@example.com',  '(11) 90000-0008');

INSERT INTO owners (name, role) VALUES
    ('Marina Costa',        'Vendedora'),
    ('Rafael Teixeira',     'Gerente comercial'),
    ('Paulo Nogueira',      'Técnico responsável');

-- Clients, owners and quote descriptions are unique on purpose: quotes find their client and owner by name,
-- follow-ups find their quote by description. Some clients have no email/phone (nullable) to cover missing data.
INSERT INTO quotes (client_id, owner_id, description, total, status, sent_at)
SELECT clients.id, owners.id, new_quotes.description, new_quotes.total, new_quotes.status, new_quotes.sent_at
FROM (VALUES
    -- draft: never sent
    ('Ana Souza', 'Marina Costa', 'Instalação de split 12000 BTUs na sala',       2850.00, 'draft',       NULL::date),
    -- sent long ago, no follow-up at all (stale)
    ('Ana Souza', 'Marina Costa', 'Manutenção preventiva de 3 aparelhos',          690.00, 'sent',        CURRENT_DATE - 45),
    -- sent long ago, only an old follow-up (stale)
    ('Bruno Lima', 'Rafael Teixeira', 'Split inverter 18000 BTUs no escritório',      4200.00, 'sent',        CURRENT_DATE - 40),
    -- sent 2 days ago (recent)
    ('Bruno Lima', 'Marina Costa', 'Limpeza completa de split',                     380.00, 'sent',        CURRENT_DATE - 2),
    -- sent a while ago but with a recent follow-up
    ('Carla Mendes', 'Rafael Teixeira', 'Ar-condicionado cassete para loja',           15800.00, 'sent',        CURRENT_DATE - 20),
    ('Carla Mendes', 'Paulo Nogueira', 'Troca de compressor',                          3150.00, 'negotiating', CURRENT_DATE - 25),
    -- edge: last contact 7 days ago
    ('Diego Ferreira', 'Marina Costa', 'Instalação de 2 splits nos quartos',           7400.00, 'sent',        CURRENT_DATE - 8),
    -- edge: sent 15 days ago, no follow-up
    ('Diego Ferreira', 'Paulo Nogueira', 'Higienização de dutos',                        1950.00, 'sent',        CURRENT_DATE - 15),
    ('Eva Martins', 'Rafael Teixeira', 'Sistema VRF para escritório',                 48900.00, 'negotiating', CURRENT_DATE - 30),
    ('Eva Martins', 'Paulo Nogueira', 'Recarga de gás refrigerante',                   520.00, 'no_response', CURRENT_DATE - 35),
    ('Fábio Rocha', 'Rafael Teixeira', 'Split piso-teto 36000 BTUs',                   6300.00, 'won',         CURRENT_DATE - 60),
    ('Fábio Rocha', 'Paulo Nogueira', 'Contrato anual de manutenção',                 2400.00, 'won',         CURRENT_DATE - 90),
    ('Gisele Alves', 'Marina Costa', 'Instalação de split 9000 BTUs',                2100.00, 'lost',        CURRENT_DATE - 50),
    ('Gisele Alves', 'Rafael Teixeira', 'Câmara fria para restaurante',                22000.00, 'no_response', CURRENT_DATE - 28),
    -- edge: last contact 15 days ago
    ('Hélio Barros', 'Paulo Nogueira', 'Split 24000 BTUs para sala comercial',         5600.00, 'sent',        CURRENT_DATE - 30),
    -- edge: last contact 14 days ago
    ('Hélio Barros', 'Marina Costa', 'Manutenção corretiva de evaporadora',           450.00, 'sent',        CURRENT_DATE - 21)
) AS new_quotes (client_name, owner_name, description, total, status, sent_at)
JOIN clients ON clients.name = new_quotes.client_name
JOIN owners ON owners.name = new_quotes.owner_name;

INSERT INTO follow_ups (quote_id, contacted_at, description)
SELECT quotes.id, new_follow_ups.contacted_at, new_follow_ups.description
FROM (VALUES
    ('Split inverter 18000 BTUs no escritório',   CURRENT_DATE - 33, 'Ligação: cliente pediu prazo para decidir'),
    ('Ar-condicionado cassete para loja',         CURRENT_DATE - 3,  'WhatsApp: aguardando aprovação do sócio'),
    ('Troca de compressor',                       CURRENT_DATE - 18, 'Ligação: cliente pediu desconto'),
    ('Troca de compressor',                       CURRENT_DATE - 6,  'E-mail: enviada proposta revisada'),
    ('Instalação de 2 splits nos quartos',        CURRENT_DATE - 7,  'WhatsApp: cliente vai comparar com outro orçamento'),
    ('Sistema VRF para escritório',               CURRENT_DATE - 21, 'Reunião: visita técnica no local'),
    ('Sistema VRF para escritório',               CURRENT_DATE - 10, 'Ligação: ajuste de escopo'),
    ('Sistema VRF para escritório',               CURRENT_DATE - 1,  'E-mail: nova versão do orçamento enviada'),
    ('Recarga de gás refrigerante',               CURRENT_DATE - 29, 'Ligação: sem resposta'),
    ('Split piso-teto 36000 BTUs',                CURRENT_DATE - 52, 'Ligação: cliente aprovou o valor'),
    ('Split piso-teto 36000 BTUs',                CURRENT_DATE - 44, 'WhatsApp: instalação agendada'),
    ('Contrato anual de manutenção',              CURRENT_DATE - 80, 'Reunião: contrato assinado'),
    ('Instalação de split 9000 BTUs',             CURRENT_DATE - 42, 'Ligação: cliente achou caro'),
    ('Instalação de split 9000 BTUs',             CURRENT_DATE - 35, 'E-mail: cliente fechou com outra empresa'),
    ('Split 24000 BTUs para sala comercial',      CURRENT_DATE - 15, 'Ligação: cliente vai avaliar'),
    ('Manutenção corretiva de evaporadora',       CURRENT_DATE - 14, 'WhatsApp: cliente pediu para aguardar')
) AS new_follow_ups (quote_description, contacted_at, description)
JOIN quotes ON quotes.description = new_follow_ups.quote_description;
