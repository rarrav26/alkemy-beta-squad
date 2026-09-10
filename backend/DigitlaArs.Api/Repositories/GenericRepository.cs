using System.Linq.Expressions;
using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Repositories;

public class GenericRepository<T>(DigitalArsDbContext context) : IGenericRepository<T> where T : class
{
    private readonly DigitalArsDbContext _context = context;
    private readonly DbSet<T> _dbSet = context.Set<T>();

    public Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default)
        => _dbSet.ToListAsync(cancellationToken);

    public Task<T?> GetByIdAsync(object[] keyValues, CancellationToken cancellationToken = default)
        => _dbSet.FindAsync(keyValues, cancellationToken).AsTask();

    public Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
        => _dbSet.Where(predicate).ToListAsync(cancellationToken);

    public Task AddAsync(T entity, CancellationToken cancellationToken = default)
        => _dbSet.AddAsync(entity, cancellationToken).AsTask();

    public void Update(T entity)
        => _dbSet.Update(entity);

    public void Remove(T entity)
        => _dbSet.Remove(entity);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);
}
