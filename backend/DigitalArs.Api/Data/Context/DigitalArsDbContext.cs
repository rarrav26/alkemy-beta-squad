using System;
using System.Collections.Generic;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Helpers.Domain;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Data.Context;

public partial class DigitalArsDbContext : DbContext
{
    public DigitalArsDbContext(DbContextOptions<DigitalArsDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cuenta> Cuentas { get; set; }

    public virtual DbSet<Movimiento> Movimientos { get; set; }

    public virtual DbSet<Tipo_Movimiento> Tipo_Movimientos { get; set; }

    public virtual DbSet<Tarjeta> Tarjetas { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.UseCollation("Modern_Spanish_CI_AS");

        modelBuilder.Entity<Cuenta>(entity =>
        {
            entity.HasIndex(e => e.alias, "UQ_Cuentas_Alias").IsUnique();

            entity.HasIndex(e => e.cvu, "UQ_Cuentas_Cvu").IsUnique();

            entity.HasIndex(e => e.usuario_id, "UQ_Cuentas_UsuarioId").IsUnique();

            entity.Property(e => e.alias)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.cvu)
                .HasMaxLength(22)
                .IsUnicode(false);
            entity.Property(e => e.saldo).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.usuario).WithOne(p => p.Cuenta)
                .HasForeignKey<Cuenta>(d => d.usuario_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Cuentas_Usuarios");
        });

        modelBuilder.Entity<Movimiento>(entity =>
        {
            entity.Property(e => e.fecha).HasPrecision(3);
            entity.Property(e => e.importe).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.cuenta).WithMany(p => p.Movimientos)
                .HasForeignKey(d => d.cuenta_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Movimientos_Cuentas");

            entity.HasOne(d => d.tipo_movimiento).WithMany(p => p.Movimientos)
                .HasForeignKey(d => d.tipo_movimiento_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Movimientos_Tipo_Movimiento");
        });

        modelBuilder.Entity<Tipo_Movimiento>(entity =>
        {
            entity.ToTable("Tipo_Movimiento");

            entity.HasIndex(e => e.descripcion, "UQ_Tipo_Movimiento_Descripcion").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.descripcion).HasMaxLength(50);
        });

        modelBuilder.Entity<Tarjeta>(entity =>
        {
            entity.HasIndex(e => e.numero, "UQ_Tarjetas_Numero").IsUnique();

            // "Una unica tarjeta vigente por cuenta". HasFilter es lo que traduce el indice
            // filtrado de la base (WHERE estado IN (...)): sin el, EF creeria que la
            // unicidad aplica a TODAS las filas de la cuenta y una tarjeta dada de baja
            // impediria generar otra.
            // El filtro se escribe con los nombres de columna de SQL, no de C#, porque es
            // SQL crudo que EF pega tal cual. Está copiado EXACTO de como lo devuelve
            // sys.indexes.filter_definition (con el espacio después de la coma): si difiere,
            // un scaffold futuro lo ve como un cambio y genera una migración al aire.
            entity.HasIndex(e => e.cuenta_id, "UQ_Tarjetas_CuentaVigente")
                .IsUnique()
                .HasFilter("([estado] IN ('ACTIVA', 'CONGELADA'))");

            entity.Property(e => e.numero)
                .HasMaxLength(16)
                .IsUnicode(false);
            entity.Property(e => e.cvv)
                .HasMaxLength(3)
                .IsFixedLength()
                .IsUnicode(false);
            entity.Property(e => e.estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue(EstadoDeTarjeta.Activa, "DF_Tarjetas_Estado");
            entity.Property(e => e.fecha_alta)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.fecha_baja).HasPrecision(3);

            entity.HasOne(d => d.cuenta).WithMany(p => p.Tarjetas)
                .HasForeignKey(d => d.cuenta_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tarjetas_Cuentas");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasIndex(e => new { e.tipo_documento, e.nro_documento }, "UQ_Usuarios_Documento").IsUnique();

            entity.HasIndex(e => e.email, "UQ_Usuarios_Email").IsUnique();

            entity.Property(e => e.apellido)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.email).HasMaxLength(256);
            entity.Property(e => e.identity_user_id).HasMaxLength(450);
            entity.Property(e => e.is_active).HasDefaultValue(true, "DF_Usuarios_IsActive");
            entity.Property(e => e.nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.nro_documento).HasMaxLength(20);
            entity.Property(e => e.tipo_documento).HasMaxLength(20);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
