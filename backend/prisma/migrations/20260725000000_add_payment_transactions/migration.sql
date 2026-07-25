-- CreateTable
CREATE TABLE [dbo].[PaymentTransactions] (
    [id]              NVARCHAR(30) NOT NULL,
    [orderId]         NVARCHAR(30) NOT NULL,
    [gateway]         NVARCHAR(200) NOT NULL,
    [type]            NVARCHAR(200) NOT NULL CONSTRAINT [PaymentTransactions_type_df] DEFAULT 'PAYMENT',
    [amount]          DECIMAL(18,2) NOT NULL,
    [status]          NVARCHAR(200) NOT NULL CONSTRAINT [PaymentTransactions_status_df] DEFAULT 'PENDING',
    [requestPayload]  NVARCHAR(max),
    [responsePayload] NVARCHAR(max),
    [gatewayRef]      NVARCHAR(200),
    [errorMessage]    NVARCHAR(200),
    [ipAddress]       NVARCHAR(200),
    [createdAt]       DATETIME2 NOT NULL CONSTRAINT [PaymentTransactions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]       DATETIME2 NOT NULL,

    CONSTRAINT [PaymentTransactions_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [PaymentTransactions_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Orders]([id]) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PaymentTransactions_orderId_idx] ON [dbo].[PaymentTransactions]([orderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PaymentTransactions_gatewayRef_idx] ON [dbo].[PaymentTransactions]([gatewayRef]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PaymentTransactions_status_idx] ON [dbo].[PaymentTransactions]([status]);
